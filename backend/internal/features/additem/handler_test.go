package additem

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
	tempDir, err := os.MkdirTemp("", "additem-test-*")
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

	body := bytes.NewBufferString(`{"title":"Buy groceries"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/"+listID+"/items", body)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("expected status %d, got %d: %s", http.StatusCreated, rr.Code, rr.Body.String())
	}

	var resp AddItemResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.ItemID == "" {
		t.Error("expected itemId to be set")
	}

	// Verify event was persisted
	eventsFile := filepath.Join(listDir, "events.jsonl")
	data, err := os.ReadFile(eventsFile)
	if err != nil {
		t.Fatalf("failed to read events file: %v", err)
	}
	if !bytes.Contains(data, []byte("Buy groceries")) {
		t.Error("expected events file to contain item title")
	}
	if !bytes.Contains(data, []byte("ItemAdded")) {
		t.Error("expected events file to contain ItemAdded event type")
	}
}

func TestHandler_EmptyTitle(t *testing.T) {
	body := bytes.NewBufferString(`{"title":""}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/test-list/items", body)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_WhitespaceOnlyTitle(t *testing.T) {
	body := bytes.NewBufferString(`{"title":"   "}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/test-list/items", body)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/list/test-list/items", nil)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

func TestHandler_InvalidJSON(t *testing.T) {
	body := bytes.NewBufferString(`{invalid json}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/test-list/items", body)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}
