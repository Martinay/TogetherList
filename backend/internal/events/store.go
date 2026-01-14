// Package events provides event sourcing types and storage.
package events

import (
	"bufio"
	"encoding/json"
	"os"
	"path/filepath"
	"syscall"
	"time"
)

// DefaultDataDir is the default directory for storing event files.
const DefaultDataDir = "./data"

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
	return filepath.Join(s.dataDir, listID, "events.jsonl")
}

// ensureDir creates the directory for a list if it doesn't exist.
func (s *FileEventStore) ensureDir(listID string) error {
	dir := filepath.Join(s.dataDir, listID)
	return os.MkdirAll(dir, 0755)
}

// Append adds a new event to the store for a specific list.
// Uses file locking to ensure safe concurrent writes.
func (s *FileEventStore) Append(listID string, event Event) error {
	if err := s.ensureDir(listID); err != nil {
		return err
	}

	filePath := s.eventFilePath(listID)
	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	// Acquire exclusive lock (flock)
	if err := syscall.Flock(int(file.Fd()), syscall.LOCK_EX); err != nil {
		return err
	}
	defer syscall.Flock(int(file.Fd()), syscall.LOCK_UN)

	// Write event as JSON line
	encoder := json.NewEncoder(file)
	return encoder.Encode(event)
}

// ReadAll returns all events from the store for a specific list.
func (s *FileEventStore) ReadAll(listID string) ([]Event, error) {
	filePath := s.eventFilePath(listID)
	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return []Event{}, nil
		}
		return nil, err
	}
	defer file.Close()

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
