// Package observability exports only explicitly allowlisted backend telemetry.
package observability

import (
	"context"
	"errors"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/log"
	"go.opentelemetry.io/otel/metric"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

type Config struct {
	Endpoint    string
	SampleRatio float64
}

func FromEnv() (Config, error) {
	if os.Getenv("OTEL_SDK_DISABLED") == "true" {
		return Config{}, nil
	}
	cfg := Config{Endpoint: os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"), SampleRatio: 0.1}
	if value := os.Getenv("TL_OTEL_SAMPLE_RATIO"); value != "" {
		ratio, err := strconv.ParseFloat(value, 64)
		if err != nil {
			return Config{}, errors.New("invalid telemetry sampling configuration")
		}
		cfg.SampleRatio = ratio
	}
	return cfg, nil
}

type Telemetry struct {
	tracer   trace.Tracer
	logger   log.Logger
	requests metric.Int64Counter
	failures metric.Int64Counter
	duration metric.Float64Histogram
	shutdown []func(context.Context) error
}

func New(ctx context.Context, cfg Config) (*Telemetry, error) {
	t := &Telemetry{}
	installDiagnostics()
	if cfg.Endpoint == "" {
		return t, nil
	}
	u, err := url.Parse(cfg.Endpoint)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || cfg.SampleRatio < 0 || cfg.SampleRatio > 1 || cfg.SampleRatio != cfg.SampleRatio {
		return nil, errors.New("invalid telemetry endpoint or sampling configuration")
	}
	// No host, process, environment or detector attributes: these can contain secrets.
	res := serviceResource()
	tr, err := otlptracehttp.New(ctx, otlptracehttp.WithEndpointURL(cfg.Endpoint), otlptracehttp.WithHTTPClient(privateClient("traces")), otlptracehttp.WithCompression(otlptracehttp.NoCompression), otlptracehttp.WithURLPath(strings.TrimRight(u.Path, "/")+"/v1/traces"), otlptracehttp.WithTimeout(time.Second), otlptracehttp.WithRetry(otlptracehttp.RetryConfig{Enabled: false}))
	if err != nil {
		return nil, errors.New("cannot initialize trace exporter")
	}
	tp := sdktrace.NewTracerProvider(sdktrace.WithResource(res), sdktrace.WithoutPanicRecording(), sdktrace.WithSampler(sdktrace.TraceIDRatioBased(cfg.SampleRatio)), sdktrace.WithBatcher(tr, sdktrace.WithMaxQueueSize(512), sdktrace.WithMaxExportBatchSize(128), sdktrace.WithBatchTimeout(time.Second), sdktrace.WithExportTimeout(time.Second)))
	t.shutdown = append(t.shutdown, tp.Shutdown)
	t.tracer = tp.Tracer("backend/http")
	me, err := otlpmetrichttp.New(ctx, otlpmetrichttp.WithEndpointURL(cfg.Endpoint), otlpmetrichttp.WithHTTPClient(privateClient("metrics")), otlpmetrichttp.WithCompression(otlpmetrichttp.NoCompression), otlpmetrichttp.WithURLPath(strings.TrimRight(u.Path, "/")+"/v1/metrics"), otlpmetrichttp.WithTimeout(time.Second), otlpmetrichttp.WithRetry(otlpmetrichttp.RetryConfig{Enabled: false}))
	if err != nil {
		_ = t.Shutdown(ctx)
		return nil, errors.New("cannot initialize metric exporter")
	}
	mp := sdkmetric.NewMeterProvider(sdkmetric.WithResource(res), sdkmetric.WithReader(sdkmetric.NewPeriodicReader(me, sdkmetric.WithInterval(60*time.Second), sdkmetric.WithTimeout(time.Second))))
	t.shutdown = append(t.shutdown, mp.Shutdown)
	meter := mp.Meter("backend/http")
	t.requests, _ = meter.Int64Counter("http.server.request.count")
	t.failures, _ = meter.Int64Counter("http.server.error.count")
	t.duration, _ = meter.Float64Histogram("http.server.request.duration", metric.WithUnit("s"), metric.WithExplicitBucketBoundaries(.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10, 30))
	le, err := otlploghttp.New(ctx, otlploghttp.WithEndpointURL(cfg.Endpoint), otlploghttp.WithHTTPClient(privateClient("logs")), otlploghttp.WithCompression(otlploghttp.NoCompression), otlploghttp.WithURLPath(strings.TrimRight(u.Path, "/")+"/v1/logs"), otlploghttp.WithTimeout(time.Second), otlploghttp.WithRetry(otlploghttp.RetryConfig{Enabled: false}))
	if err != nil {
		_ = t.Shutdown(ctx)
		return nil, errors.New("cannot initialize log exporter")
	}
	lp := sdklog.NewLoggerProvider(sdklog.WithResource(res), sdklog.WithProcessor(sdklog.NewBatchProcessor(le, sdklog.WithMaxQueueSize(512), sdklog.WithExportMaxBatchSize(128), sdklog.WithExportInterval(time.Second), sdklog.WithExportTimeout(time.Second))))
	t.shutdown = append(t.shutdown, lp.Shutdown)
	t.logger = lp.Logger("backend/http")
	return t, nil
}

// Shutdown flushes all signals concurrently so one unavailable exporter cannot
// consume another signal's deadline. Callers provide the shared shutdown budget.
func (t *Telemetry) Shutdown(ctx context.Context) error {
	var wg sync.WaitGroup
	errs := make(chan error, len(t.shutdown))
	for _, shutdown := range t.shutdown {
		wg.Go(func() { errs <- shutdown(ctx) })
	}
	wg.Wait()
	close(errs)
	var result error
	for err := range errs {
		result = errors.Join(result, err)
	}
	return result
}
