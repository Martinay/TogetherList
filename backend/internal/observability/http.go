package observability

import (
	"net/http"
	"strings"
	"time"

	"github.com/felixge/httpsnoop"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/log"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/trace"
)

// Wrap resolves the route using the server mux, before the handler runs. Nothing
// is derived from the raw URL, headers, payload, remote address or error text.
func (t *Telemetry) Wrap(next http.Handler, mux *http.ServeMux, patterns ...string) http.Handler {
	if t == nil || t.tracer == nil {
		return next
	}
	allowed := make(map[string]bool, len(patterns))
	for _, pattern := range patterns {
		allowed[pattern] = true
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, pattern := mux.Handler(r)
		if !allowed[pattern] {
			pattern = ""
		}
		if pattern == "GET /health" {
			next.ServeHTTP(w, r)
			return
		}
		route := pattern
		if _, path, found := strings.Cut(pattern, " "); found {
			route = path
		}
		if route == "" || route == "/api/" {
			route = "unmatched"
		}
		if route == "/" {
			route = "frontend"
		}
		method := r.Method
		switch method {
		case "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "CONNECT", "TRACE":
		default:
			method = "_OTHER"
		}
		attrs := []attribute.KeyValue{attribute.String("http.request.method", method), attribute.String("http.route", route)}
		// A new root avoids untrusted remote sampling decisions, tracestate and baggage.
		ctx, span := t.tracer.Start(r.Context(), method+" "+route, trace.WithNewRoot(), trace.WithSpanKind(trace.SpanKindServer), trace.WithAttributes(attrs...))
		defer span.End()
		var panicValue any
		result := httpsnoop.CaptureMetricsFn(w, func(writer http.ResponseWriter) {
			defer func() { panicValue = recover() }()
			next.ServeHTTP(writer, r.WithContext(ctx))
		})
		if panicValue != nil {
			result.Code = http.StatusInternalServerError
			defer func() { panic(panicValue) }()
		}
		attrs = append(attrs, attribute.Int("http.response.status_code", result.Code))
		span.SetAttributes(attribute.Int("http.response.status_code", result.Code), attribute.Int("http.status_code", result.Code))
		if result.Code >= 500 {
			span.SetStatus(codes.Error, "server error")
		}
		options := metric.WithAttributes(attrs...)
		t.requests.Add(ctx, 1, options)
		if result.Code >= 400 {
			t.failures.Add(ctx, 1, options)
		}
		t.duration.Record(ctx, result.Duration.Seconds(), options)
		// Align request logs with trace sampling; metrics always count every request.
		if !span.SpanContext().IsSampled() {
			return
		}
		var record log.Record
		record.SetTimestamp(time.Now())
		record.SetBody(attribute.StringValue("http request completed"))
		record.SetSeverity(log.SeverityInfo)
		if result.Code >= 400 {
			record.SetSeverity(log.SeverityError)
		}
		record.AddAttributes(attribute.String("http.request.method", method), attribute.String("http.route", route), attribute.Int("http.response.status_code", result.Code), attribute.Float64("duration_seconds", result.Duration.Seconds()))
		t.logger.Emit(ctx, record)
	})
}
