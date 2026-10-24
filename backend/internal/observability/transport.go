package observability

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/sdk/resource"
	logs "go.opentelemetry.io/proto/otlp/collector/logs/v1"
	metrics "go.opentelemetry.io/proto/otlp/collector/metrics/v1"
	traces "go.opentelemetry.io/proto/otlp/collector/trace/v1"
	commonpb "go.opentelemetry.io/proto/otlp/common/v1"
	resourcepb "go.opentelemetry.io/proto/otlp/resource/v1"
	"google.golang.org/protobuf/proto"
)

func serviceResource() *resource.Resource {
	return resource.NewWithAttributes("", attribute.String("service.name", "togetherlist-backend"))
}

// The SDK merges OTEL_RESOURCE_ATTRIBUTES even with WithResource. Sanitize at
// the final OTLP boundary so environment attributes never leave this process.
type privateTransport struct {
	next   http.RoundTripper
	signal string
}

func (p privateTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	body, err := io.ReadAll(req.Body)
	if err != nil {
		return nil, errors.New("cannot read telemetry batch")
	}
	_ = req.Body.Close()
	safe := func() *resourcepb.Resource {
		return &resourcepb.Resource{Attributes: []*commonpb.KeyValue{{Key: "service.name", Value: &commonpb.AnyValue{Value: &commonpb.AnyValue_StringValue{StringValue: "togetherlist-backend"}}}}}
	}
	var message proto.Message
	switch p.signal {
	case "traces":
		batch := &traces.ExportTraceServiceRequest{}
		if err := proto.Unmarshal(body, batch); err != nil {
			return nil, errors.New("invalid trace batch")
		}
		for _, rs := range batch.ResourceSpans {
			rs.Resource = safe()
			rs.SchemaUrl = ""
		}
		message = batch
	case "metrics":
		batch := &metrics.ExportMetricsServiceRequest{}
		if err := proto.Unmarshal(body, batch); err != nil {
			return nil, errors.New("invalid metric batch")
		}
		for _, rm := range batch.ResourceMetrics {
			rm.Resource = safe()
			rm.SchemaUrl = ""
		}
		message = batch
	case "logs":
		batch := &logs.ExportLogsServiceRequest{}
		if err := proto.Unmarshal(body, batch); err != nil {
			return nil, errors.New("invalid log batch")
		}
		for _, rl := range batch.ResourceLogs {
			rl.Resource = safe()
			rl.SchemaUrl = ""
		}
		message = batch
	default:
		return nil, errors.New("unknown telemetry signal")
	}
	body, err = proto.Marshal(message)
	if err != nil {
		return nil, errors.New("cannot encode telemetry batch")
	}
	clone := req.Clone(req.Context())
	clone.Body = io.NopCloser(bytes.NewReader(body))
	clone.ContentLength = int64(len(body))
	clone.GetBody = func() (io.ReadCloser, error) { return io.NopCloser(bytes.NewReader(body)), nil }
	return p.next.RoundTrip(clone)
}

func privateClient(signal string) *http.Client {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	// Exporter endpoints are operator-configured; never route loopback telemetry
	// through an environment proxy and never follow redirects with auth headers.
	transport.Proxy = nil
	return &http.Client{Transport: privateTransport{next: transport, signal: signal}, Timeout: time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
}
