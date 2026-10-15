package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	healthHandler(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	contentType := rec.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected Content-Type application/json, got %s", contentType)
	}

	body := rec.Body.String()
	if body == "" {
		t.Error("expected non-empty body")
	}
}

func TestMCPEndpoint_Route(t *testing.T) {
	handler := setupRoutes()
	for _, path := range []string{"/api/v1/mcp", "/mcp"} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(`{"jsonrpc":"2.0","id":1,"method":"tools/list"}`))
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			var resp struct {
				Result struct {
					Tools []struct {
						Name string `json:"name"`
					} `json:"tools"`
				} `json:"result"`
			}
			if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
				t.Fatal(err)
			}
			if rec.Code != http.StatusOK || len(resp.Result.Tools) != 8 || strings.Contains(rec.Body.String(), "list_lists") {
				t.Fatalf("expected eight tools without list_lists, got %d: %s", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestUnknownAPIRouteDoesNotServeSPA(t *testing.T) {
	directory := t.TempDir()
	if err := os.WriteFile(filepath.Join(directory, "index.html"), []byte("<html>SPA shell</html>"), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("STATIC_DIR", directory)
	request := httptest.NewRequest(http.MethodGet, "/api/v1/does-not-exist", nil)
	recorder := httptest.NewRecorder()
	setupRoutes().ServeHTTP(recorder, request)
	if recorder.Code != http.StatusNotFound {
		t.Fatalf("expected API 404, got %d", recorder.Code)
	}
	if strings.Contains(recorder.Header().Get("Content-Type"), "text/html") {
		t.Fatal("unknown API route served SPA HTML")
	}
}
