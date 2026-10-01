package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
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

func TestSPAHandler_RootedFiles(t *testing.T) {
	parent := t.TempDir()
	root := filepath.Join(parent, "static")
	if err := os.MkdirAll(filepath.Join(root, "assets"), 0755); err != nil {
		t.Fatal(err)
	}
	for name, content := range map[string]string{"index.html": "SPA", "assets/app.js": "asset"} {
		if err := os.WriteFile(filepath.Join(root, name), []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}
	outside := filepath.Join(parent, "secret.txt")
	if err := os.WriteFile(outside, []byte("SECRET"), 0644); err != nil {
		t.Fatal(err)
	}
	for name, target := range map[string]string{"escape.txt": outside, "escape-dir": parent, "internal.js": "assets/app.js"} {
		if err := os.Symlink(target, filepath.Join(root, name)); err != nil {
			t.Fatal(err)
		}
	}
	handler := newSPAHandler(root)
	for _, tc := range []struct {
		path   string
		status int
		body   string
	}{
		{"/assets/app.js", 200, "asset"}, {"/internal.js", 200, "asset"},
		{"/list/abc", 200, "SPA"}, {"/assets", 200, "SPA"}, {"/", 200, "SPA"},
		{"/list/abc/", 200, "SPA"}, {"/assets/", 200, "SPA"},
		{"/../secret.txt", 403, ""}, {"/%2e%2e/secret.txt", 403, ""},
		{"/assets/../../secret.txt", 403, ""},
		{"/assets/../", 403, ""}, {"/assets/%2e%2e/", 403, ""},
		{"/escape.txt", 500, ""}, {"/escape-dir/secret.txt", 500, ""},
	} {
		t.Run(tc.path, func(t *testing.T) {
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, tc.path, nil))
			if rec.Code != tc.status {
				t.Fatalf("status = %d, want %d", rec.Code, tc.status)
			}
			if tc.body != "" && rec.Body.String() != tc.body {
				t.Fatalf("body = %q, want %q", rec.Body.String(), tc.body)
			}
			if strings.Contains(rec.Body.String(), "SECRET") {
				t.Fatal("outside file leaked")
			}
		})
	}
	if err := os.Remove(filepath.Join(root, "index.html")); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(root, "index.html")); err != nil {
		t.Fatal(err)
	}
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/missing", nil))
	if rec.Code != 500 || strings.Contains(rec.Body.String(), "SECRET") {
		t.Fatalf("unsafe fallback: %d %q", rec.Code, rec.Body.String())
	}
}

func TestSPAHandler_MissingRootAndIndex(t *testing.T) {
	for _, root := range []string{t.TempDir(), filepath.Join(t.TempDir(), "missing")} {
		rec := httptest.NewRecorder()
		newSPAHandler(root).ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/missing", nil))
		if rec.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want 404", rec.Code)
		}
	}
}
