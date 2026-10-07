// Package events provides event sourcing types and storage.
package events

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"syscall"
	"time"
)

// DefaultDataDir is the default directory for storing event files.
const DefaultDataDir = "./data"

var ErrRevisionConflict = errors.New("list changed since read")

var ErrIdempotencyConflict = errors.New("idempotency key reused with different payload")

// FileEventStore implements Store using JSONL files on the filesystem.
// Each list gets its own directory with an events.jsonl file.
type FileEventStore struct {
	dataDir string
}

// NewFileEventStore creates a new FileEventStore.
// Uses DATA_DIR environment variable if set, otherwise uses DefaultDataDir.
func NewFileEventStore() *FileEventStore {
	dataDir := os.Getenv("DATA_DIR")
	if dataDir == "" {
		dataDir = DefaultDataDir
	}
	return &FileEventStore{dataDir: dataDir}
}

// NewFileEventStoreWithDir creates a new FileEventStore with a specific directory.
// Useful for testing.
func NewFileEventStoreWithDir(dataDir string) *FileEventStore {
	return &FileEventStore{dataDir: dataDir}
}

// eventFilePath returns the path to the events file for a list.
func (s *FileEventStore) eventFilePath(listID string) string {
	return filepath.Join(s.dataDir, filepath.Base(listID), "events.jsonl")
}

// ensureDir creates the directory for a list if it doesn't exist.
func (s *FileEventStore) ensureDir(listID string) error {
	dir := filepath.Join(s.dataDir, listID)
	return os.MkdirAll(dir, 0750)
}

// Append adds a new event to the store for a specific list.
// Uses file locking to ensure safe concurrent writes.
func (s *FileEventStore) Append(listID string, event Event) error {
	if err := s.ensureDir(listID); err != nil {
		return err
	}

	filePath := s.eventFilePath(listID)
	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_RDWR, 0600) // #nosec G304
	if err != nil {
		return err
	}
	defer file.Close()

	// Acquire exclusive lock (flock)
	if err := syscall.Flock(int(file.Fd()), syscall.LOCK_EX); err != nil { // #nosec G115
		return err
	}
	defer syscall.Flock(int(file.Fd()), syscall.LOCK_UN) // #nosec G115

	// Check under the same lock as append so retries across processes are atomic.
	lastID := ""
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		var prior Event
		if err := json.Unmarshal(scanner.Bytes(), &prior); err != nil {
			return err
		}
		lastID = prior.ID
		if event.ID != "" && prior.ID == event.ID {
			a, err := json.Marshal(prior.Payload)
			if err != nil {
				return err
			}
			b, err := json.Marshal(event.Payload)
			if err != nil {
				return err
			}
			// Normalize typed and decoded payloads to the same JSON representation.
			var normalized any
			if err := json.Unmarshal(b, &normalized); err != nil {
				return err
			}
			b, err = json.Marshal(normalized)
			if err != nil {
				return err
			}
			if prior.Type != event.Type || !bytes.Equal(a, b) {
				return ErrIdempotencyConflict
			}
			return nil
		}
	}
	if err := scanner.Err(); err != nil {
		return err
	}
	if event.ExpectedRevision != "" && event.ExpectedRevision != lastID {
		return ErrRevisionConflict
	}
	// Write event as JSON line
	encoder := json.NewEncoder(file)
	if err := encoder.Encode(event); err != nil {
		return err
	}
	return file.Sync()
}

// ReadAll returns all events from the store for a specific list.
func (s *FileEventStore) ReadAll(listID string) ([]Event, error) {
	filePath := s.eventFilePath(listID)
	file, err := os.Open(filePath) // #nosec G304
	if err != nil {
		if os.IsNotExist(err) {
			return []Event{}, nil
		}
		return nil, err
	}
	defer file.Close()

	if err := syscall.Flock(int(file.Fd()), syscall.LOCK_SH); err != nil {
		return nil, err
	} // #nosec G115
	defer syscall.Flock(int(file.Fd()), syscall.LOCK_UN) // #nosec G115

	var events []Event
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		var event Event
		if err := json.Unmarshal(scanner.Bytes(), &event); err != nil {
			return nil, err
		}
		events = append(events, event)
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return events, nil
}

// ReadSince returns events after the given timestamp for a specific list.
func (s *FileEventStore) ReadSince(listID string, since time.Time) ([]Event, error) {
	allEvents, err := s.ReadAll(listID)
	if err != nil {
		return nil, err
	}

	var filtered []Event
	for _, event := range allEvents {
		if event.Timestamp.After(since) {
			filtered = append(filtered, event)
		}
	}

	return filtered, nil
}

// ListIDs returns the IDs of all lists that have an events.jsonl file.
func (s *FileEventStore) ListIDs() ([]string, error) {
	entries, err := os.ReadDir(s.dataDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []string{}, nil
		}
		return nil, err
	}

	var listIDs []string
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		eventsPath := filepath.Join(s.dataDir, entry.Name(), "events.jsonl")
		if _, err := os.Stat(eventsPath); err == nil {
			listIDs = append(listIDs, entry.Name())
		}
	}

	return listIDs, nil
}
