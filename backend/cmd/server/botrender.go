package main

import (
	"bytes"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// botRenderHandler wraps an http.Handler and serves a pre-rendered landing page
// to known AI and search engine crawlers. Human visitors get the normal SPA.
type botRenderHandler struct {
	next            http.Handler
	landingHTMLPath string
}

// crawlerTokens contains user-agent substrings for AI and search crawlers.
var crawlerTokens = []string{
	// AI crawlers
	"GPTBot",
	"ChatGPT-User",
	"OAI-SearchBot",
	"ClaudeBot",
	"Claude-User",
	"Claude-SearchBot",
	"PerplexityBot",
	"Applebot-Extended",
	"anthropic-ai",
	"cohere-ai",
	"Google-Extended",
	// Search engine crawlers
	"Googlebot",
	"Bingbot",
	"bingbot",
	"Slurp",
	"DuckDuckBot",
	"YandexBot",
	"Baiduspider",
	// Social media crawlers
	"facebookexternalhit",
	"Twitterbot",
	"LinkedInBot",
	"WhatsApp",
	"TelegramBot",
}

// newBotRenderHandler wraps a handler with bot detection that serves landing.html
// to crawlers. Falls back to next handler for all other requests.
func newBotRenderHandler(next http.Handler, staticDir string) *botRenderHandler {
	return &botRenderHandler{
		next:            next,
		landingHTMLPath: filepath.Join(staticDir, "landing.html"),
	}
}

// ServeHTTP checks user-agent and serves pre-rendered HTML to crawlers.
func (h *botRenderHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Only intercept the root path for bot rendering
	if r.URL.Path != "/" {
		h.next.ServeHTTP(w, r)
		return
	}

	w.Header().Add("Vary", "User-Agent")
	ua := r.UserAgent()
	if ua != "" && isCrawler(ua) {
		// #nosec G304 G703 -- landingHTMLPath is built from a trusted environment variable
		if _, err := os.Stat(h.landingHTMLPath); err == nil {
			// #nosec G304 G703 -- trusted path
			http.ServeFile(w, r, h.landingHTMLPath)
			return
		}
	}

	// The shared shell stays noindex for deep links; the public root must be
	// indexable even when the crawler is unknown or JavaScript is unavailable.
	indexPath := filepath.Join(filepath.Dir(h.landingHTMLPath), "index.html")
	// #nosec G304 G703 -- indexPath is built from the trusted static directory
	if shell, err := os.ReadFile(indexPath); err == nil {
		shell = bytes.Replace(shell, []byte(`content="noindex, nofollow"`), []byte(`content="index, follow"`), 1)
		http.ServeContent(w, r, "index.html", time.Time{}, bytes.NewReader(shell))
		return
	}
	h.next.ServeHTTP(w, r)
}

// isCrawler checks whether the user-agent string belongs to a known crawler.
func isCrawler(ua string) bool {
	for _, token := range crawlerTokens {
		if strings.Contains(ua, token) {
			return true
		}
	}
	return false
}
