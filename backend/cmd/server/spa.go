package main

import (
	"io/fs"
	"net/http"
	"os"
	"strings"
)

// spaHandler serves static files and falls back to index.html for SPA routing.
type spaHandler struct{ staticDir string }

func newSPAHandler(staticDir string) *spaHandler {
	return &spaHandler{staticDir: staticDir}
}

func (h *spaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	name := strings.TrimPrefix(r.URL.Path, "/")
	// Allow a trailing slash without cleaning away traversal components.
	name = strings.TrimSuffix(name, "/")
	if name == "" {
		name = "."
	}
	if !fs.ValidPath(name) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	file, err := os.OpenInRoot(h.staticDir, name)
	if err == nil {
		defer file.Close()
		info, statErr := file.Stat()
		if statErr != nil {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			return
		}
		if !info.IsDir() {
			http.ServeContent(w, r, info.Name(), info.ModTime(), file)
			return
		}
	} else if !os.IsNotExist(err) {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	index, err := os.OpenInRoot(h.staticDir, "index.html")
	if err != nil {
		if os.IsNotExist(err) {
			http.NotFound(w, r)
		} else {
			http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		}
		return
	}
	defer index.Close()
	info, err := index.Stat()
	if err != nil || info.IsDir() {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	http.ServeContent(w, r, "index.html", info.ModTime(), index)
}
