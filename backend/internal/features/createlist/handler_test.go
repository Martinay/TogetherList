package createlist

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestHandler(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		body           any
		wantStatus     int
		wantListID     bool
		wantErrMessage string
	}{
		{
			name:       "valid request with participants",
			method:     http.MethodPost,
			body:       CreateListRequest{Creator: "Alice", Participants: []string{"Bob", "Charlie"}},
			wantStatus: http.StatusCreated,
			wantListID: true,
		},
		{
			name:       "valid request without participants",
			method:     http.MethodPost,
			body:       CreateListRequest{Creator: "Alice", Participants: []string{}},
			wantStatus: http.StatusCreated,
			wantListID: true,
		},
		{
			name:       "creator already in participants",
			method:     http.MethodPost,
			body:       CreateListRequest{Creator: "Alice", Participants: []string{"Alice", "Bob"}},
			wantStatus: http.StatusCreated,
			wantListID: true,
		},
		{
			name:           "missing creator",
			method:         http.MethodPost,
			body:           CreateListRequest{Creator: "", Participants: []string{"Bob"}},
			wantStatus:     http.StatusBadRequest,
			wantErrMessage: "Creator name is required",
		},
		{
			name:       "wrong method GET",
			method:     http.MethodGet,
			body:       nil,
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "wrong method PUT",
			method:     http.MethodPut,
			body:       CreateListRequest{Creator: "Alice"},
			wantStatus: http.StatusMethodNotAllowed,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup temp data dir
			tmpDir := t.TempDir()
			t.Setenv("DATA_DIR", tmpDir)

			var bodyBytes []byte
			if tt.body != nil {
				var err error
				bodyBytes, err = json.Marshal(tt.body)
				if err != nil {
					t.Fatalf("failed to marshal body: %v", err)
				}
			}

			req := httptest.NewRequest(tt.method, "/list/create", bytes.NewReader(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			Handler(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("got status %d, want %d", w.Code, tt.wantStatus)
			}

			if tt.wantListID {
				var resp CreateListResponse
				if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
					t.Fatalf("failed to decode response: %v", err)
				}
				if resp.ListID == "" {
					t.Error("expected listId in response")
				}

				// Verify event file was created
				eventFile := filepath.Join(tmpDir, resp.ListID, "events.jsonl")
				if _, err := os.Stat(eventFile); os.IsNotExist(err) {
					t.Errorf("event file not created at %s", eventFile)
				}
			}
		})
	}
}
