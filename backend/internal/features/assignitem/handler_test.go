package assignitem

import (
	"github.com/google/uuid"
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"backend/internal/events"
)

func seedListWithItem(t *testing.T, listID, itemID string) {
	t.Helper()
	store := events.NewFileEventStore()
	if err := store.Append(listID, events.Event{Type: events.EventTypeListCreated, Payload: events.ListCreatedPayload{Name: "Test", Participants: []string{"Alice", "Bob", "Carol"}}}); err != nil {
		t.Fatalf("failed to seed list event: %v", err)
	}
	if err := store.Append(listID, events.Event{Type: events.EventTypeItemAdded, Payload: events.ItemAddedPayload{ItemID: itemID, Title: "Task", CreatedBy: "Alice"}}); err != nil {
		t.Fatalf("failed to seed item event: %v", err)
	}
}

func TestHandler_AssignSuccess(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "assignitem-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	listID := uuid.New().String()
	itemID := uuid.New().String()
	seedListWithItem(t, listID, itemID)

	body := bytes.NewBufferString(`{"assignedTo":["Alice","Bob"]}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/"+listID+"/items/"+itemID+"/assigned-to", body)
	req.SetPathValue("id", listID)
	req.SetPathValue("itemId", itemID)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d: %s", http.StatusOK, rr.Code, rr.Body.String())
	}

	var resp map[string]string
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}
	if resp["status"] != "updated" {
		t.Errorf("expected status 'updated', got '%s'", resp["status"])
	}

	data, err := os.ReadFile(filepath.Join(tempDir, listID, "events.jsonl"))
	if err != nil {
		t.Fatalf("failed to read events file: %v", err)
	}
	if !bytes.Contains(data, []byte("ItemAssigned")) {
		t.Error("expected events file to contain ItemAssigned")
	}
	if !bytes.Contains(data, []byte("Alice")) || !bytes.Contains(data, []byte("Bob")) {
		t.Error("expected events file to contain assigned participants")
	}
}

func TestHandler_ClearAssignmentSuccess(t *testing.T) {
	tempDir, _ := os.MkdirTemp("", "assignitem-test-*")
	defer os.RemoveAll(tempDir)
	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	listID := uuid.New().String()
	itemID := uuid.New().String()
	seedListWithItem(t, listID, itemID)

	body := bytes.NewBufferString(`{"assignedTo":[]}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/"+listID+"/items/"+itemID+"/assigned-to", body)
	req.SetPathValue("id", listID)
	req.SetPathValue("itemId", itemID)
	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rr.Code)
	}
}

func TestHandler_RejectsUnknownParticipant(t *testing.T) {
	tempDir, _ := os.MkdirTemp("", "assignitem-test-*")
	defer os.RemoveAll(tempDir)
	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	listID := uuid.New().String()
	itemID := uuid.New().String()
	seedListWithItem(t, listID, itemID)

	body := bytes.NewBufferString(`{"assignedTo":["Mallory"]}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/"+listID+"/items/"+itemID+"/assigned-to", body)
	req.SetPathValue("id", listID)
	req.SetPathValue("itemId", itemID)
	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}
