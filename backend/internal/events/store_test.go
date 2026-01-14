package events

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestFileEventStore_AppendAndReadAll(t *testing.T) {
	// Create temp directory for test
	tmpDir := t.TempDir()
	store := NewFileEventStoreWithDir(tmpDir)
	listID := uuid.New().String()

	// Create test events
	events := []Event{
		{
			ID:        uuid.New().String(),
			Type:      EventTypeListCreated,
			Payload:   ListCreatedPayload{Name: "Shopping List", Participants: []string{"Alice", "Bob"}},
			Timestamp: time.Now(),
		},
	}

	// Append events
	for _, event := range events {
		if err := store.Append(listID, event); err != nil {
			t.Fatalf("failed to append event: %v", err)
		}
	}

	// Read events back
	readEvents, err := store.ReadAll(listID)
	if err != nil {
		t.Fatalf("failed to read events: %v", err)
	}

	if len(readEvents) != len(events) {
		t.Errorf("expected %d events, got %d", len(events), len(readEvents))
	}

	// Verify first event
	if readEvents[0].Type != EventTypeListCreated {
		t.Errorf("expected event type %s, got %s", EventTypeListCreated, readEvents[0].Type)
	}
}

func TestFileEventStore_ReadAll_NonExistentList(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewFileEventStoreWithDir(tmpDir)

	// Reading from non-existent list should return empty slice
	events, err := store.ReadAll("non-existent-list")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if len(events) != 0 {
		t.Errorf("expected 0 events, got %d", len(events))
	}
}

func TestFileEventStore_ReadSince(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewFileEventStoreWithDir(tmpDir)
	listID := uuid.New().String()

	baseTime := time.Now()

	// Create events with different timestamps
	event1 := Event{
		ID:        uuid.New().String(),
		Type:      EventTypeListCreated,
		Payload:   ListCreatedPayload{Name: "List 1", Participants: []string{}},
		Timestamp: baseTime.Add(-2 * time.Hour),
	}
	event2 := Event{
		ID:        uuid.New().String(),
		Type:      EventTypeListCreated,
		Payload:   ListCreatedPayload{Name: "List 2", Participants: []string{}},
		Timestamp: baseTime.Add(-1 * time.Hour),
	}
	event3 := Event{
		ID:        uuid.New().String(),
		Type:      EventTypeListCreated,
		Payload:   ListCreatedPayload{Name: "List 3", Participants: []string{}},
		Timestamp: baseTime,
	}

	// Append all events
	for _, event := range []Event{event1, event2, event3} {
		if err := store.Append(listID, event); err != nil {
			t.Fatalf("failed to append event: %v", err)
		}
	}

	// Read events since 90 minutes ago
	since := baseTime.Add(-90 * time.Minute)
	events, err := store.ReadSince(listID, since)
	if err != nil {
		t.Fatalf("failed to read events since: %v", err)
	}

	// Should only get event2 and event3
	if len(events) != 2 {
		t.Errorf("expected 2 events, got %d", len(events))
	}
}

func TestFileEventStore_CreatesDirectory(t *testing.T) {
	tmpDir := t.TempDir()
	store := NewFileEventStoreWithDir(tmpDir)
	listID := uuid.New().String()

	event := Event{
		ID:        uuid.New().String(),
		Type:      EventTypeListCreated,
		Payload:   ListCreatedPayload{Name: "Test List", Participants: []string{}},
		Timestamp: time.Now(),
	}

	if err := store.Append(listID, event); err != nil {
		t.Fatalf("failed to append event: %v", err)
	}

	// Verify directory was created
	expectedDir := filepath.Join(tmpDir, listID)
	if _, err := os.Stat(expectedDir); os.IsNotExist(err) {
		t.Errorf("expected directory %s to exist", expectedDir)
	}

	// Verify file was created
	expectedFile := filepath.Join(expectedDir, "events.jsonl")
	if _, err := os.Stat(expectedFile); os.IsNotExist(err) {
		t.Errorf("expected file %s to exist", expectedFile)
	}
}

func TestNewFileEventStore_UsesEnvVar(t *testing.T) {
	// Set environment variable
	originalValue := os.Getenv("DATA_DIR")
	os.Setenv("DATA_DIR", "/custom/path")
	defer os.Setenv("DATA_DIR", originalValue)

	store := NewFileEventStore()

	// We can't directly access dataDir, but we can verify behavior
	// by checking the path it would use
	expectedPath := "/custom/path"
	if store.dataDir != expectedPath {
		t.Errorf("expected dataDir %s, got %s", expectedPath, store.dataDir)
	}
}

func TestNewFileEventStore_UsesDefaultWhenNoEnvVar(t *testing.T) {
	// Clear environment variable
	originalValue := os.Getenv("DATA_DIR")
	os.Unsetenv("DATA_DIR")
	defer os.Setenv("DATA_DIR", originalValue)

	store := NewFileEventStore()

	if store.dataDir != DefaultDataDir {
		t.Errorf("expected dataDir %s, got %s", DefaultDataDir, store.dataDir)
	}
}
