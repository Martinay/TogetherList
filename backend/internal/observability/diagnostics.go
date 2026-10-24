package observability

import (
	"log"
	"sync"
	"sync/atomic"
	"time"

	"go.opentelemetry.io/otel"
)

var diagnosticsOnce sync.Once
var lastDiagnostic atomic.Int64

// SafeDiagnostics suppresses SDK and HTTP diagnostic payloads (which may contain
// endpoint credentials or panic values), and rate-limits outage noise.
type SafeDiagnostics struct{}

func (SafeDiagnostics) Write(p []byte) (int, error) {
	now := time.Now().Unix()
	previous := lastDiagnostic.Load()
	if now-previous >= 60 && lastDiagnostic.CompareAndSwap(previous, now) {
		log.Print("Backend telemetry or HTTP diagnostic failure; details suppressed")
	}
	return len(p), nil
}

func installDiagnostics() {
	diagnosticsOnce.Do(func() {
		otel.SetErrorHandler(otel.ErrorHandlerFunc(func(error) { _, _ = (SafeDiagnostics{}).Write(nil) }))
	})
}
