package main

import (
	"net/http"
	"os"
	"path/filepath"
)

// spaHandler serves static files and falls back to index.html for SPA routing.
type spaHandler struct {
	staticDir string
	indexPath string
}

// newSPAHandler creates a new SPA handler with the given static directory.
func newSPAHandler(staticDir string) *spaHandler {
	return &spaHandler{
		staticDir: staticDir,
		indexPath: filepath.Join(staticDir, "index.html"),
	}
}

// ServeHTTP implements http.Handler for SPA routing.
func (h *spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Clean the path to prevent directory traversal
	path := filepath.Join(h.staticDir, filepath.Clean(r.URL.Path))

	// Check if the file exists
	info, err := os.Stat(path)
	if os.IsNotExist(err) || info.IsDir() {
		// File doesn't exist or is a directory, serve index.html for SPA routing
		http.ServeFile(w, r, h.indexPath)
		return
	}

	if err != nil {
		// Some other error occurred
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	// File exists, serve it
	http.ServeFile(w, r, path)
}
