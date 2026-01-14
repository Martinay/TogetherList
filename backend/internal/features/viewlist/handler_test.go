package viewlist

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"backend/internal/events"
)

func TestHandler_EmptyList(t *testing.T) {
	// Create temp directory for test data
	tempDir, err := os.MkdirTemp("", "viewlist-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	// Create a list with a ListCreated event
	listID := "test-list-123"
	store := events.NewFileEventStoreWithDir(tempDir)
	event := events.Event{
		ID:        "evt-1",
		Type:      events.EventTypeListCreated,
		Timestamp: time.Now().UTC(),
		Payload: events.ListCreatedPayload{
			Name:         "Test List",
			Participants: []string{"Alice", "Bob"},
		},
	}
	if err := store.Append(listID, event); err != nil {
		t.Fatalf("failed to append event: %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/list/"+listID, nil)
	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d: %s", http.StatusOK, rr.Code, rr.Body.String())
	}

	var state events.ListState
	if err := json.NewDecoder(rr.Body).Decode(&state); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if state.Name != "Test List" {
		t.Errorf("expected name 'Test List', got '%s'", state.Name)
	}
	if len(state.Participants) != 2 {
		t.Errorf("expected 2 participants, got %d", len(state.Participants))
	}
	if len(state.Items) != 0 {
		t.Errorf("expected 0 items, got %d", len(state.Items))
	}
}

func TestHandler_ListWithItems(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "viewlist-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	listID := "test-list-456"
	store := events.NewFileEventStoreWithDir(tempDir)

	// Create list
	createEvent := events.Event{
		ID:        "evt-1",
		Type:      events.EventTypeListCreated,
		Timestamp: time.Now().UTC(),
		Payload: events.ListCreatedPayload{
			Name:         "Shopping",
			Participants: []string{"Charlie"},
		},
	}
	store.Append(listID, createEvent)

	// Add item
	addEvent := events.Event{
		ID:        "evt-2",
		Type:      events.EventTypeItemAdded,
		Timestamp: time.Now().UTC(),
		Payload: events.ItemAddedPayload{
			ItemID: "item-1",
			Title:  "Buy milk",
		},
	}
	store.Append(listID, addEvent)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/list/"+listID, nil)
	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d: %s", http.StatusOK, rr.Code, rr.Body.String())
	}

	var state events.ListState
	if err := json.NewDecoder(rr.Body).Decode(&state); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(state.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(state.Items))
	}

	item, exists := state.Items["item-1"]
	if !exists {
		t.Fatal("expected item 'item-1' to exist")
	}
	if item.Title != "Buy milk" {
		t.Errorf("expected title 'Buy milk', got '%s'", item.Title)
	}
}

func TestHandler_NonexistentList(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "viewlist-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	req := httptest.NewRequest(http.MethodGet, "/api/v1/list/nonexistent", nil)
	rr := httptest.NewRecorder()
	Handler(rr, req)

	// Should return OK with empty state (no events = empty list)
	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d: %s", http.StatusOK, rr.Code, rr.Body.String())
	}
}

func TestHandler_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/test-list", nil)
	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

func setupTestData(t *testing.T, tempDir, listID string) {
	listDir := filepath.Join(tempDir, listID)
	if err := os.MkdirAll(listDir, 0755); err != nil {
		t.Fatalf("failed to create list dir: %v", err)
	}
}
