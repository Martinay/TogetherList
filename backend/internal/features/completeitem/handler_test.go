package completeitem

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

func TestHandler_CompleteSuccess(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "completeitem-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	listID := uuid.New().String()
	listDir := filepath.Join(tempDir, listID)
	if err := os.MkdirAll(listDir, 0755); err != nil {
		t.Fatalf("failed to create list dir: %v", err)
	}

	itemID := uuid.New().String()
	body := bytes.NewBufferString(`{"isCompleted":true,"completedBy":"Alice"}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/"+listID+"/items/"+itemID+"/completed", body)
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

	eventsFile := filepath.Join(listDir, "events.jsonl")
	data, err := os.ReadFile(eventsFile)
	if err != nil {
		t.Fatalf("failed to read events file: %v", err)
	}
	if !bytes.Contains(data, []byte("ItemCompleted")) {
		t.Error("expected events file to contain ItemCompleted event type")
	}
	if !bytes.Contains(data, []byte(itemID)) {
		t.Error("expected events file to contain item ID")
	}
	if !bytes.Contains(data, []byte("Alice")) {
		t.Error("expected events file to contain completedBy name")
	}
}

func TestHandler_UncompleteSuccess(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "completeitem-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	os.Setenv("DATA_DIR", tempDir)
	defer os.Unsetenv("DATA_DIR")

	listID := uuid.New().String()
	listDir := filepath.Join(tempDir, listID)
	if err := os.MkdirAll(listDir, 0755); err != nil {
		t.Fatalf("failed to create list dir: %v", err)
	}

	itemID := uuid.New().String()
	body := bytes.NewBufferString(`{"isCompleted":false,"completedBy":"Bob"}`)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/"+listID+"/items/"+itemID+"/completed", body)
	req.SetPathValue("id", listID)
	req.SetPathValue("itemId", itemID)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status %d, got %d: %s", http.StatusOK, rr.Code, rr.Body.String())
	}
}

func TestHandler_EmptyCompletedBy(t *testing.T) {
	body := bytes.NewBufferString(`{"isCompleted":true,"completedBy":""}`)
	listID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/" + listID + "/items/test-item/completed", body)
	req.SetPathValue("id", listID)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_MissingCompletedBy(t *testing.T) {
	body := bytes.NewBufferString(`{"isCompleted":true}`)
	listID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/" + listID + "/items/test-item/completed", body)
	req.SetPathValue("id", listID)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_MethodNotAllowed(t *testing.T) {
	listID := uuid.New().String()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/list/" + listID + "/items/test-item/completed", nil)
	req.SetPathValue("id", listID)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

func TestHandler_InvalidJSON(t *testing.T) {
	body := bytes.NewBufferString(`{invalid json}`)
	listID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPut, "/api/v1/list/" + listID + "/items/test-item/completed", body)
	req.SetPathValue("id", listID)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}
