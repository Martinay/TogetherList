package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestSPAHandler_ServesStaticFile(t *testing.T) {
	// Create a temporary directory with test files
	tmpDir := t.TempDir()

	// Create index.html
	indexContent := []byte("<!DOCTYPE html><html><body>SPA</body></html>")
	if err := os.WriteFile(filepath.Join(tmpDir, "index.html"), indexContent, 0644); err != nil {
		t.Fatal(err)
	}

	// Create a CSS file
	cssContent := []byte("body { color: red; }")
	if err := os.WriteFile(filepath.Join(tmpDir, "style.css"), cssContent, 0644); err != nil {
		t.Fatal(err)
	}

	handler := newSPAHandler(tmpDir)

	// Test serving existing CSS file
	req := httptest.NewRequest(http.MethodGet, "/style.css", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	if rec.Body.String() != string(cssContent) {
		t.Errorf("expected CSS content, got %s", rec.Body.String())
	}
}

func TestSPAHandler_FallsBackToIndex(t *testing.T) {
	tmpDir := t.TempDir()

	indexContent := []byte("<!DOCTYPE html><html><body>SPA</body></html>")
	if err := os.WriteFile(filepath.Join(tmpDir, "index.html"), indexContent, 0644); err != nil {
		t.Fatal(err)
	}

	handler := newSPAHandler(tmpDir)

	// Test SPA route that doesn't exist as a file
	req := httptest.NewRequest(http.MethodGet, "/list/abc123", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	if rec.Body.String() != string(indexContent) {
		t.Errorf("expected index.html content for SPA route, got %s", rec.Body.String())
	}
}

func TestSPAHandler_ServesRootAsIndex(t *testing.T) {
	tmpDir := t.TempDir()

	indexContent := []byte("<!DOCTYPE html><html><body>SPA</body></html>")
	if err := os.WriteFile(filepath.Join(tmpDir, "index.html"), indexContent, 0644); err != nil {
		t.Fatal(err)
	}

	handler := newSPAHandler(tmpDir)

	// Test root path
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	if rec.Body.String() != string(indexContent) {
		t.Errorf("expected index.html content, got %s", rec.Body.String())
	}
}
