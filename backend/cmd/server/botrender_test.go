package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestIsCrawler(t *testing.T) {
	tests := []struct {
		name     string
		ua       string
		expected bool
	}{
		{"GPTBot is detected", "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.3", true},
		{"ClaudeBot is detected", "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", true},
		{"PerplexityBot is detected", "Mozilla/5.0 (compatible; PerplexityBot/1.0)", true},
		{"Googlebot is detected", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", true},
		{"Bingbot is detected", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", true},
		{"Chrome is not a crawler", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0", false},
		{"Firefox is not a crawler", "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0", false},
		{"Safari is not a crawler", "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15", false},
		{"empty ua is not a crawler", "", false},
		{"OAI-SearchBot is detected", "Mozilla/5.0 AppleWebKit/537.36; compatible; OAI-SearchBot/1.0", true},
		{"facebookexternalhit is detected", "facebookexternalhit/1.1", true},
		{"Twitterbot is detected", "Twitterbot/1.0", true},
		{"WhatsApp is detected", "WhatsApp/2.23.20.0", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isCrawler(tt.ua)
			if result != tt.expected {
				t.Errorf("isCrawler(%q) = %v, want %v", tt.ua, result, tt.expected)
			}
		})
	}
}

func TestBotRenderHandler_ServesLandingHTMLToBots(t *testing.T) {
	tmpDir := t.TempDir()
	landingContent := "<html><body><h1>Pre-rendered landing</h1></body></html>"
	if err := os.WriteFile(filepath.Join(tmpDir, "landing.html"), []byte(landingContent), 0644); err != nil {
		t.Fatal(err)
	}

	fallback := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SPA fallback"))
	})

	handler := newBotRenderHandler(fallback, tmpDir)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; GPTBot/1.3)")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	body := rec.Body.String()
	if body == "SPA fallback" {
		t.Error("expected pre-rendered landing HTML, got SPA fallback")
	}
}

func TestBotRenderHandler_ServesSPAToHumans(t *testing.T) {
	tmpDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(tmpDir, "landing.html"), []byte("<html>bot page</html>"), 0644); err != nil {
		t.Fatal(err)
	}

	fallback := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SPA fallback"))
	})

	handler := newBotRenderHandler(fallback, tmpDir)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	body := rec.Body.String()
	if body != "SPA fallback" {
		t.Errorf("expected SPA fallback for human user-agent, got %q", body)
	}
}

func TestBotRenderHandler_PassesThroughNonRootPaths(t *testing.T) {
	tmpDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(tmpDir, "landing.html"), []byte("<html>bot page</html>"), 0644); err != nil {
		t.Fatal(err)
	}

	fallback := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SPA fallback"))
	})

	handler := newBotRenderHandler(fallback, tmpDir)

	req := httptest.NewRequest(http.MethodGet, "/list/abc", nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; GPTBot/1.3)")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	body := rec.Body.String()
	if body != "SPA fallback" {
		t.Errorf("expected SPA fallback for non-root path, got %q", body)
	}
}

func TestBotRenderHandler_FallsBackWhenLandingHTMLMissing(t *testing.T) {
	tmpDir := t.TempDir()

	fallback := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("SPA fallback"))
	})

	handler := newBotRenderHandler(fallback, tmpDir)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; GPTBot/1.3)")
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)

	body := rec.Body.String()
	if body != "SPA fallback" {
		t.Errorf("expected SPA fallback when landing.html missing, got %q", body)
	}
}
