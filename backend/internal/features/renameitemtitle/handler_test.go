package renameitemtitle

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestHandler_Success(t *testing.T) {
	// Create temp directory for test data
	tempDir, err := os.MkdirTemp("", "edititem-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Set DATA_DIR for the test
	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	// Create a list directory to simulate existing list
	listID := "test-list-123"
	listDir := filepath.Join(tempDir, listID)
	if err := os.MkdirAll(listDir, 0755); err != nil {
		t.Fatalf("failed to create list dir: %v", err)
	}

	itemID := "test-item-456"
	body := bytes.NewBufferString(`{"newTitle":"Updated Title"}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/"+listID+"/items/"+itemID+"/title", body)
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

	// Verify event was persisted
	eventsFile := filepath.Join(listDir, "events.jsonl")
	data, err := os.ReadFile(eventsFile)
	if err != nil {
		t.Fatalf("failed to read events file: %v", err)
	}
	if !bytes.Contains(data, []byte("Updated Title")) {
		t.Error("expected events file to contain new title")
	}
	if !bytes.Contains(data, []byte("ItemTitleEdited")) {
		t.Error("expected events file to contain ItemTitleEdited event type")
	}
	if !bytes.Contains(data, []byte(itemID)) {
		t.Error("expected events file to contain item ID")
	}
}

func TestHandler_EmptyNewTitle(t *testing.T) {
	body := bytes.NewBufferString(`{"newTitle":""}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/test-list/items/test-item/title", body)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_WhitespaceOnlyNewTitle(t *testing.T) {
	body := bytes.NewBufferString(`{"newTitle":"   "}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/test-list/items/test-item/title", body)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/list/test-list/items/test-item/title", nil)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

func TestHandler_InvalidJSON(t *testing.T) {
	body := bytes.NewBufferString(`{invalid json}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/test-list/items/test-item/title", body)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}
