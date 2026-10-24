package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"backend/internal/observability"
	logs "go.opentelemetry.io/proto/otlp/collector/logs/v1"
	metrics "go.opentelemetry.io/proto/otlp/collector/metrics/v1"
	traces "go.opentelemetry.io/proto/otlp/collector/trace/v1"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

func TestOTLPActualServerExportsPrivateCorrelatedSignals(t *testing.T) {
	t.Setenv("DATA_DIR", t.TempDir())
	t.Setenv("OTEL_RESOURCE_ATTRIBUTES", "secret=RESOURCE_SECRET")
	var mu sync.Mutex
	var exported []proto.Message
	receiver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var message proto.Message
		switch r.URL.Path {
		case "/v1/traces":
			message = &traces.ExportTraceServiceRequest{}
		case "/v1/logs":
			message = &logs.ExportLogsServiceRequest{}
		case "/v1/metrics":
			message = &metrics.ExportMetricsServiceRequest{}
		default:
			t.Errorf("unexpected signal endpoint")
			w.WriteHeader(404)
			return
		}
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Error(err)
			return
		}
		if err := proto.Unmarshal(body, message); err != nil {
			t.Error(err)
			return
		}
		mu.Lock()
		exported = append(exported, message)
		mu.Unlock()
		w.Header().Set("Content-Type", "application/x-protobuf")
	}))
	defer receiver.Close()
	telemetry, err := observability.New(context.Background(), observability.Config{Endpoint: receiver.URL, SampleRatio: 1})
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(setupRoutesWithTelemetry(telemetry))
	defer server.Close()
	request := func(method, path, body string, status int) []byte {
		t.Helper()
		req, err := http.NewRequest(method, server.URL+path, strings.NewReader(body))
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set("Authorization", "Bearer AUTH_SECRET")
		req.Header.Set("Cookie", "secret=COOKIE_SECRET")
		req.Header.Set("User-Agent", "AGENT_SECRET")
		req.Header.Set("Baggage", "private=BAGGAGE_SECRET")
		req.Header.Set("Tracestate", "vendor=STATE_SECRET")
		req.Header.Set("Traceparent", "00-11111111111111111111111111111111-2222222222222222-01")
		resp, err := server.Client().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		data, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != status {
			t.Fatalf("status %d expected %d", resp.StatusCode, status)
		}
		return data
	}
	data := request("POST", "/api/v1/list/create?secret=QUERY_SECRET", `{"name":"LIST_SECRET","creator":"NAME_SECRET"}`, 201)
	var created struct {
		ListID string `json:"listId"`
	}
	if err := json.Unmarshal(data, &created); err != nil {
		t.Fatal(err)
	}
	request("GET", "/api/v1/list/"+created.ListID+"?secret=QUERY_SECRET", "", 200)
	itemData := request("POST", "/api/v1/list/"+created.ListID+"/items", `{"title":"TITLE_SECRET","description":"DESCRIPTION_SECRET","createdBy":"NAME_SECRET"}`, 201)
	var item struct {
		ItemID string `json:"itemId"`
	}
	if err := json.Unmarshal(itemData, &item); err != nil {
		t.Fatal(err)
	}
	request("PUT", "/api/v1/list/"+created.ListID+"/items/"+item.ItemID+"/description", `{"description":"DESCRIPTION_SECRET"}`, 200)
	request("POST", "/api/v1/list/create", `BODY_SECRET`, 400)
	request("GET", "/api/v1/list/CAPABILITY_SECRET", "", 400)
	request("GET", "/api/UNKNOWN_SECRET?token=QUERY_SECRET", "", 404)
	request("GET", "/health", "", 200)
	// A real streaming MCP request must flush its first event before shutdown.
	streamCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	req, err := http.NewRequestWithContext(streamCtx, "GET", server.URL+"/mcp/sse", nil)
	if err != nil {
		t.Fatal(err)
	}
	response, err := server.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	chunk := make([]byte, 5)
	_, err = io.ReadFull(response.Body, chunk)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Contains(chunk, []byte("event")) {
		t.Fatalf("stream was not flushed: %q", chunk)
	}
	cancel()
	_ = response.Body.Close()
	// Wait for the streaming handler to observe cancellation and emit its span.
	server.Close()
	ctx, done := context.WithTimeout(context.Background(), 3*time.Second)
	defer done()
	if err := telemetry.Shutdown(ctx); err != nil {
		t.Fatal(err)
	}
	mu.Lock()
	defer mu.Unlock()
	var spanID, traceID []byte
	var correlated bool
	var requestCount, errorCount int64
	var durations uint64
	var spans, records int
	var all strings.Builder
	for _, message := range exported {
		encoded, err := protojson.Marshal(message)
		if err != nil {
			t.Fatal(err)
		}
		all.Write(encoded)
		if batch, ok := message.(*traces.ExportTraceServiceRequest); ok {
			for _, res := range batch.ResourceSpans {
				for _, scope := range res.ScopeSpans {
					for _, span := range scope.Spans {
						spans++
						if span.Name == "POST /api/v1/list/create" {
							traceID, spanID = span.TraceId, span.SpanId
						}
						if len(span.ParentSpanId) != 0 || bytes.Equal(span.TraceId, bytes.Repeat([]byte{0x11}, 16)) {
							t.Error("untrusted remote context retained")
						}
					}
				}
			}
		}
	}
	for _, message := range exported {
		if batch, ok := message.(*logs.ExportLogsServiceRequest); ok {
			for _, res := range batch.ResourceLogs {
				for _, scope := range res.ScopeLogs {
					for _, record := range scope.LogRecords {
						records++
						if bytes.Equal(record.TraceId, traceID) && bytes.Equal(record.SpanId, spanID) {
							correlated = true
						}
					}
				}
			}
		}
		if batch, ok := message.(*metrics.ExportMetricsServiceRequest); ok {
			for _, res := range batch.ResourceMetrics {
				for _, scope := range res.ScopeMetrics {
					for _, metric := range scope.Metrics {
						if metric.GetSum() != nil {
							for _, point := range metric.GetSum().DataPoints {
								switch metric.Name {
								case "http.server.request.count":
									requestCount += point.GetAsInt()
								case "http.server.error.count":
									errorCount += point.GetAsInt()
								}
							}
						}
						if metric.Name == "http.server.request.duration" {
							for _, point := range metric.GetHistogram().DataPoints {
								durations += point.Count
							}
						}
					}
				}
			}
		}
	}
	if spans != 8 || records != 8 || requestCount != 8 || errorCount != 3 || durations != 8 || !correlated {
		t.Fatalf("spans=%d logs=%d requests=%d errors=%d durations=%d correlated=%v", spans, records, requestCount, errorCount, durations, correlated)
	}
	for _, secret := range []string{created.ListID, item.ItemID, "RESOURCE_SECRET", "AUTH_SECRET", "COOKIE_SECRET", "AGENT_SECRET", "BAGGAGE_SECRET", "STATE_SECRET", "QUERY_SECRET", "LIST_SECRET", "NAME_SECRET", "TITLE_SECRET", "DESCRIPTION_SECRET", "BODY_SECRET", "CAPABILITY_SECRET", "UNKNOWN_SECRET", "/health", "url.full", "url.path", "client.address", "http.target"} {
		if strings.Contains(all.String(), secret) {
			t.Errorf("private value/attribute exported: %s", secret)
		}
	}
}
