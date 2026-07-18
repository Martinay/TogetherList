package edititemdescription

import (
	"github.com/google/uuid"
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
	tempDir, err := os.MkdirTemp("", "edititemdesc-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Set DATA_DIR for the test
	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	// Create a list directory to simulate existing list
	listID := uuid.New().String()
	listDir := filepath.Join(tempDir, listID)
	if err := os.MkdirAll(listDir, 0755); err != nil {
		t.Fatalf("failed to create list dir: %v", err)
	}

	itemID := uuid.New().String()
	body := bytes.NewBufferString(`{"description":"New description"}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/"+listID+"/items/"+itemID+"/description", body)
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

	// Verify event was persisted
	eventsFile := filepath.Join(listDir, "events.jsonl")
	data, err := os.ReadFile(eventsFile)
	if err != nil {
		t.Fatalf("failed to read events file: %v", err)
	}
	if !bytes.Contains(data, []byte("New description")) {
		t.Error("expected events file to contain new description")
	}
	if !bytes.Contains(data, []byte("ItemDescriptionEdited")) {
		t.Error("expected events file to contain ItemDescriptionEdited event type")
	}
	if !bytes.Contains(data, []byte(itemID)) {
		t.Error("expected events file to contain item ID")
	}
}

func TestHandler_EmptyDescriptionAllowed(t *testing.T) {
	// Empty description is allowed to clear it
	tempDir, _ := os.MkdirTemp("", "edititemdesc-test-*")
	defer os.RemoveAll(tempDir)
	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")
	listID := uuid.New().String()
	os.MkdirAll(filepath.Join(tempDir, listID), 0755)

	body := bytes.NewBufferString(`{"description":""}`)
	itemID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/" + listID + "/items/" + itemID + "/description", body)
	req.SetPathValue("id", listID)
	req.SetPathValue("itemId", itemID)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d", http.StatusOK, rr.Code)
	}
}

func TestHandler_MethodNotAllowed(t *testing.T) {
	listID := uuid.New().String()
	itemID := uuid.New().String()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/list/" + listID + "/items/" + itemID + "/description", nil)
	req.SetPathValue("id", listID)
	req.SetPathValue("itemId", itemID)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

func TestHandler_InvalidJSON(t *testing.T) {
	body := bytes.NewBufferString(`{invalid json}`)
	listID := uuid.New().String()
	itemID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/" + listID + "/items/" + itemID + "/description", body)
	req.SetPathValue("id", listID)
	req.SetPathValue("itemId", itemID)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}
