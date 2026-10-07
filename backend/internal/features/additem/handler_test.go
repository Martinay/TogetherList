package additem

import (
	"backend/internal/events"
	"bytes"
	"encoding/json"
	"github.com/google/uuid"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
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
	listID := uuid.New().String()
	listDir := filepath.Join(tempDir, listID)
	if err := os.MkdirAll(listDir, 0755); err != nil {
		t.Fatalf("failed to create list dir: %v", err)
	}

	if err := events.NewFileEventStore().Append(listID, events.Event{ID: uuid.New().String(), Type: events.EventTypeListCreated, Timestamp: time.Now(), Payload: events.ListCreatedPayload{Name: "Test", Participants: []string{"Alice"}}}); err != nil {
		t.Fatal(err)
	}

	body := bytes.NewBufferString(`{"title":"Buy groceries","createdBy":"Alice"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/"+listID+"/items", body)
	req.SetPathValue("id", listID)
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
	body := bytes.NewBufferString(`{"title":"","createdBy":"Alice"}`)
	listID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/"+listID+"/items", body)
	req.SetPathValue("id", listID)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_WhitespaceOnlyTitle(t *testing.T) {
	body := bytes.NewBufferString(`{"title":"   ","createdBy":"Alice"}`)
	listID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/"+listID+"/items", body)
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
	req := httptest.NewRequest(http.MethodGet, "/api/v1/list/"+listID+"/items", nil)
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
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/"+listID+"/items", body)
	req.SetPathValue("id", listID)

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_EmptyCreatedBy(t *testing.T) {
	body := bytes.NewBufferString(`{"title":"Test item","createdBy":""}`)
	listID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/"+listID+"/items", body)
	req.SetPathValue("id", listID)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_MissingCreatedBy(t *testing.T) {
	body := bytes.NewBufferString(`{"title":"Test item"}`)
	listID := uuid.New().String()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/list/"+listID+"/items", body)
	req.SetPathValue("id", listID)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	Handler(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, rr.Code)
	}
}

func TestHandler_IdempotentRetry(t *testing.T) {
	t.Setenv("DATA_DIR", t.TempDir())
	listID := uuid.New().String()
	if err := events.NewFileEventStore().Append(listID, events.Event{ID: uuid.New().String(), Type: events.EventTypeListCreated, Payload: events.ListCreatedPayload{Name: "Test", Participants: []string{"Alice"}}}); err != nil {
		t.Fatal(err)
	}
	key := uuid.New().String()
	send := func(title string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodPost, "/", bytes.NewBufferString(`{"title":"`+title+`","createdBy":"Alice"}`))
		req.SetPathValue("id", listID)
		req.Header.Set("Idempotency-Key", key)
		rr := httptest.NewRecorder()
		Handler(rr, req)
		return rr
	}
	first := send("Milk")
	second := send("Milk")
	if first.Code != 201 || second.Code != 201 || first.Body.String() != second.Body.String() {
		t.Fatalf("retry responses: %v %v", first, second)
	}
	if send("Other").Code != 409 {
		t.Fatal("expected conflict")
	}
	all, err := events.NewFileEventStore().ReadAll(listID)
	if err != nil || len(all) != 2 {
		t.Fatalf("events=%d err=%v", len(all), err)
	}
}
