package observability

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

func TestDisabledNeedsNoEndpoint(t *testing.T) {
	telemetry, err := New(context.Background(), Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := telemetry.Shutdown(context.Background()); err != nil {
		t.Fatal(err)
	}
}

func TestInvalidConfiguration(t *testing.T) {
	for _, cfg := range []Config{{Endpoint: "secret"}, {Endpoint: "http://user:password@localhost:4318"}, {Endpoint: "http://localhost:4318?token=secret"}, {Endpoint: "http://localhost:4318", SampleRatio: 2}} {
		if _, err := New(context.Background(), cfg); err == nil {
			t.Fatal("invalid configuration accepted")
		}
	}
}

func TestEnvironmentConfiguration(t *testing.T) {
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:4318")
	t.Setenv("TL_OTEL_SAMPLE_RATIO", "0.25")
	cfg, err := FromEnv()
	if err != nil || cfg.SampleRatio != .25 {
		t.Fatal("sampling configuration not read")
	}
	t.Setenv("TL_OTEL_SAMPLE_RATIO", "secret")
	if _, err := FromEnv(); err == nil || strings.Contains(err.Error(), "secret") {
		t.Fatal("invalid sampling not safely rejected")
	}
	t.Setenv("OTEL_SDK_DISABLED", "true")
	cfg, err = FromEnv()
	if err != nil || cfg.Endpoint != "" {
		t.Fatal("disabled telemetry requires configuration")
	}
}

func TestNoSamplingStillExportsMetrics(t *testing.T) {
	var mu sync.Mutex
	paths := map[string]int{}
	receiver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		paths[r.URL.Path]++
		mu.Unlock()
		w.Header().Set("Content-Type", "application/x-protobuf")
	}))
	defer receiver.Close()
	telemetry, err := New(context.Background(), Config{Endpoint: receiver.URL, SampleRatio: 0})
	if err != nil {
		t.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /test/{id}", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(500) })
	writer := httptest.NewRecorder()
	telemetry.Wrap(mux, mux, "GET /test/{id}").ServeHTTP(writer, httptest.NewRequest("GET", "/test/SECRET", nil))
	if writer.Code != 500 {
		t.Fatal("status changed")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := telemetry.Shutdown(ctx); err != nil {
		t.Fatal(err)
	}
	mu.Lock()
	defer mu.Unlock()
	if paths["/v1/metrics"] != 1 || len(paths) != 1 {
		t.Fatalf("unsampled exports: %v", paths)
	}
}

func TestExporterOutageIsBoundedAndDoesNotBlockHTTP(t *testing.T) {
	for _, status := range []int{http.StatusServiceUnavailable, http.StatusUnauthorized} {
		t.Run(strconv.Itoa(status), func(t *testing.T) {
			receiver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(status) }))
			defer receiver.Close()
			telemetry, err := New(context.Background(), Config{Endpoint: receiver.URL, SampleRatio: 1})
			if err != nil {
				t.Fatal(err)
			}
			mux := http.NewServeMux()
			mux.HandleFunc("GET /test", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(204) })
			started := time.Now()
			for range 1000 {
				w := httptest.NewRecorder()
				telemetry.Wrap(mux, mux, "GET /test").ServeHTTP(w, httptest.NewRequest("GET", "/test", nil))
				if w.Code != 204 {
					t.Fatal("export failure changed request")
				}
			}
			if time.Since(started) > time.Second {
				t.Fatal("request handling blocked on exporter")
			}
			ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
			defer cancel()
			started = time.Now()
			_ = telemetry.Shutdown(ctx)
			if time.Since(started) > time.Second {
				t.Fatal("shutdown exceeded budget")
			}
		})
	}
}

func TestShutdownWithStalledReceiver(t *testing.T) {
	release := make(chan struct{})
	receiver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { <-release; w.WriteHeader(503) }))
	defer receiver.Close()
	defer close(release)
	telemetry, err := New(context.Background(), Config{Endpoint: receiver.URL, SampleRatio: 1})
	if err != nil {
		t.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /test", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(204) })
	telemetry.Wrap(mux, mux, "GET /test").ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/test", nil))
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	started := time.Now()
	if err := telemetry.Shutdown(ctx); err == nil {
		t.Fatal("stalled flush reported success")
	}
	if time.Since(started) > time.Second {
		t.Fatal("shutdown exceeded budget")
	}
}

func TestPanicDoesNotExportExceptionOrPrivateValue(t *testing.T) {
	var mu sync.Mutex
	var payloads []byte
	receiver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		mu.Lock()
		payloads = append(payloads, body...)
		mu.Unlock()
		w.Header().Set("Content-Type", "application/x-protobuf")
	}))
	defer receiver.Close()
	telemetry, err := New(context.Background(), Config{Endpoint: receiver.URL, SampleRatio: 1})
	if err != nil {
		t.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("/panic", func(http.ResponseWriter, *http.Request) { panic("PANIC_SECRET") })
	func() {
		defer func() {
			if recover() != "PANIC_SECRET" {
				t.Error("panic behavior changed")
			}
		}()
		telemetry.Wrap(mux, mux, "/panic").ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/panic", nil))
	}()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := telemetry.Shutdown(ctx); err != nil {
		t.Fatal(err)
	}
	mu.Lock()
	defer mu.Unlock()
	if bytes.Contains(payloads, []byte("PANIC_SECRET")) || bytes.Contains(payloads, []byte("exception.")) {
		t.Fatal("panic contents exported")
	}
	if !bytes.Contains(payloads, []byte("http.server.error.count")) {
		t.Fatal("panic not counted")
	}
}

func TestDisabledPreservesResponseAndWriter(t *testing.T) {
	telemetry, err := New(context.Background(), Config{})
	if err != nil {
		t.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /test", func(w http.ResponseWriter, _ *http.Request) {
		if _, ok := w.(http.Flusher); !ok {
			t.Error("flusher removed")
		}
		w.Header().Set("X-Test", "preserved")
		w.WriteHeader(202)
		_, _ = w.Write([]byte("body"))
	})
	writer := httptest.NewRecorder()
	telemetry.Wrap(mux, mux, "GET /test").ServeHTTP(writer, httptest.NewRequest("GET", "/test", nil))
	if writer.Code != 202 || writer.Body.String() != "body" || writer.Header().Get("X-Test") != "preserved" {
		t.Fatal("disabled instrumentation changed response")
	}
}

func TestOnlyRegisteredPatternsBecomeRouteLabels(t *testing.T) {
	var mu sync.Mutex
	var payloads []byte
	receiver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		mu.Lock()
		payloads = append(payloads, body...)
		mu.Unlock()
		w.Header().Set("Content-Type", "application/x-protobuf")
	}))
	defer receiver.Close()
	telemetry, err := New(context.Background(), Config{Endpoint: receiver.URL, SampleRatio: 1})
	if err != nil {
		t.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /registered/{id}", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(204) })
	mux.HandleFunc("/PRIVATE_TEMPLATE", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(204) })
	// The telemetry allowlist is tied to explicit registration metadata, not a
	// mux redirect or an unregistered pattern returned by the resolver.
	wrapped := telemetry.Wrap(mux, mux, "GET /registered/{id}")
	for _, path := range []string{"/PRIVATE_TEMPLATE", "/registered/CAPABILITY_SECRET", "/registered//CAPABILITY_SECRET"} {
		wrapped.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("METHOD_SECRET", path, nil))
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := telemetry.Shutdown(ctx); err != nil {
		t.Fatal(err)
	}
	mu.Lock()
	defer mu.Unlock()
	for _, secret := range []string{"PRIVATE_TEMPLATE", "CAPABILITY_SECRET", "METHOD_SECRET"} {
		if bytes.Contains(payloads, []byte(secret)) {
			t.Fatalf("unsafe route or method label: %s", secret)
		}
	}
}
