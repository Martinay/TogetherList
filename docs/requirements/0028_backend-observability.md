---
id: REQ-0028
status: Proposed
type: NonFunctional
priority: P1
source: User request for backend observability
created: 2026-10-24
updated: 2026-10-24
links:
  adr: [0028_backend-observability.md]
  requirements: [0029_backend-telemetry-privacy.md]
tags: [backend, observability]
---

# REQ-0028: Optional backend observability

## Context

Operators need backend diagnostics in Azure Application Insights without requiring Azure credentials during local development.

## Requirement (EARS)

When backend telemetry is enabled, the system shall export correlated request logs, HTTP server traces, and request count, error count, and duration metrics to the configured OpenTelemetry receiver without changing HTTP or streaming behavior.

## Rationale

Standard OTLP keeps the Go backend independent of Azure ingestion implementation and allows real local integration testing.

## Acceptance Criteria

- Without an endpoint, or with `OTEL_SDK_DISABLED=true`, local HTTP operation needs no telemetry service or Azure credentials.
- Real HTTP requests export all three signals; log trace/span IDs match server spans.
- Server routes include REST, MCP and SSE; health checks are excluded.
- Errors include HTTP 4xx/5xx and panic counts; private exception values are excluded.
- Sampling affects traces and associated logs, while metrics count all requests.
- Export queues and timeouts are bounded. Unavailable, rejecting and stalled receivers do not block request handling.
- SIGTERM stops the HTTP server and flushes telemetry with bounded deadlines.
- Deployment provisions workspace-based Application Insights and wires a Collector sidecar using a secret reference.

## Verification

- `backend/cmd/server/observability_test.go`: actual server/JSONL/OTLP integration and SSE flush.
- `backend/internal/observability/telemetry_test.go`: sampling, invalid/disabled configuration, exporter failures, shutdown deadlines and panic behavior.
- `scripts/test-observability-pipeline.py`: deployment Collector config, actual Go server, all three Application Insights envelope types, correlation, privacy and SIGTERM flush.
- Full production browser E2E suite twice, backend race/static/security checks, Bicep build/lint.

## Dependencies and Relationships

- [Telemetry privacy](0029_backend-telemetry-privacy.md)
- [Proposed architecture](../adr/0028_backend-observability.md)
- [Operations and limitations](../backend-observability.md)
