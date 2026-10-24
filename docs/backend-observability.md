# Backend observability

Go emits standard OTLP/HTTP protobuf to a loopback Collector sidecar, whose `azuremonitor` exporter sends logs, metrics and traces to workspace-based Azure Application Insights. This is backend instrumentation only. It does not change the existing browser analytics system.

## Configuration

| Setting | Default | Effect |
| --- | --- | --- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | empty | Empty disables all instrumentation/export. Set to `http://127.0.0.1:4318` for the deployed sidecar. Each signal appends `/v1/{signal}` to the base path explicitly. |
| `OTEL_SDK_DISABLED` | unset | Exact `true` disables telemetry even with an endpoint. |
| `TL_OTEL_SAMPLE_RATIO` | `0.1` | Finite number 0..1; root trace ID ratio sampling. Logs follow sampled traces; metrics are never sampled. |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | absent locally | Collector only; injected from a Container Apps secret in Bicep. Never log it. |

Endpoint URLs permit HTTP/HTTPS, with no embedded credentials, query or fragment. HTTPS uses system trust; HTTP is appropriate for loopback. Redirects are not followed and environment proxies are not used. SDK OTLP header settings remain available for an operator-managed authenticated receiver. Per-signal URL overrides, resource environment attributes and standard sampler variables do not override this feature's explicit endpoint/resource/sampler settings. Do not instrument the exporter HTTP client.

Local development requires no Azure resources. To inspect telemetry, start an independent local OTLP receiver and set the endpoint and a sampling ratio of `1`. Invalid enabled configuration fails startup with a fixed diagnostic, without echoing configuration values. Application diagnostics are rate-limited and suppress raw SDK/HTTP errors.

## Signals and privacy

- HTTP server spans use normalized method plus registered template, such as `GET /api/v1/list/{id}`. Unknown routes are `unmatched`; SPA traffic is `frontend`. Only registered patterns may become route labels, including for mux redirects. REST, MCP and SSE are included; GET/HEAD health checks are excluded.
- Counters `http.server.request.count` and `http.server.error.count` (4xx and 5xx) and histogram `http.server.request.duration` (seconds) use method, route and response status dimensions. Durations for SSE measure the full stream lifetime, not time to first byte. Panics count as server errors without changing the panic/connection-abort semantics. Counts are process-local cumulative measurements; replicas/restarts must be considered when querying.
- Sampled request completion logs use a fixed message, structured method/route/status/duration and SDK-generated trace/span IDs. Correlation becomes `ai.operation.id` / `ai.operation.parentId` in Application Insights.
- Request bodies, responses, names, descriptions, IDs, URLs, query strings, credentials, cookies, user agents, remote addresses, baggage, tracestate and exception text/stacks are excluded. Incoming trace context is deliberately not accepted at this anonymous boundary. Only fixed `service.name=togetherlist-backend` survives resource export filtering; host/process/environment detector values never leave Go. The SDK's automatic panic event recording is disabled.
- The legacy `http.status_code` span attribute is also emitted for this pinned Azure exporter's response/success mapping. Current `http.response.status_code` remains available. No `http.target`, `http.url`, host or scheme is emitted.
- The pinned exporter maps SERVER spans to AppRequests, log messages to AppTraces and metric measurements to AppMetrics. Dependencies/exceptions are not auto-collected. Span/custom/exception events are disabled. No filelog, hostmetrics, browser SDK, payload logger or stdout scraping is added.

## Deployment and cost controls

`infra/main.bicep` provisions a PerGB2018 Log Analytics workspace and workspace-based Application Insights, obtains a **secure** connection-string module output, and passes it into an app secret. `infra/modules/container-app.bicep` injects that secret only into the Collector. Its config is embedded directly from `infra/otel-collector.yaml`; no separate unreferenced sample is used. The official pinned `otel/opentelemetry-collector-contrib:0.147.0` image runs beside the existing application image. The existing multi-stage Dockerfile still builds a static Go binary; no telemetry credentials or Collector are baked into it. Existing CI deploys this same main Bicep file; backend CI now validates and exercises the real Collector configuration before deployment jobs can run.

The Collector adds 0.25 CPU / 0.5 GiB, for a total app allocation of 0.5 CPU / 1 GiB. Loopback OTLP port 4318 is not exposed through ingress. The workspace has a best-effort 1 GB/day ingestion cap; this is a safety valve, **not a hard spending limit**. Plan cost using both Container Apps resource usage and regional telemetry ingestion prices. Start with 10% traces/logs, health exclusion, low-cardinality metrics and a 60-second metric interval. Revisit volume before increasing sampling. AppRequests/AppTraces row counts are sampled observations: the standard Go ratio sampler does not supply Azure-specific sampling weights. Use the unsampled request/error metrics for traffic/error totals, accounting for cumulative temporality and process restarts, rather than treating sampled row counts as total traffic. No volume is required for Collector queues.

Go uses nonblocking trace/log queues of 512 records, batches of 128, one-second export deadlines and no SDK retries. Collector memory limiter is 160 MiB with 32 MiB spike allowance, batches are capped at 128, and its bounded Azure exporter queue has 64 batches and one consumer. Exporter internal buffering/transmission uses the pinned implementation; there is no durable spool or guaranteed delivery. Outages can drop telemetry; HTTP requests continue. Collector internal metrics are disabled and internal logging is error-only to avoid a second telemetry feedback stream.

SIGINT/SIGTERM cancels the server base context (allowing SSE to finish), grants HTTP shutdown up to five seconds, then grants the three SDK providers a shared three-second deadline, flushing them concurrently. Failure diagnostics omit errors/configuration contents. The Collector gets a five-second exporter shutdown timeout, but Container Apps does not guarantee sidecar stop ordering: rollout/termination can still lose a final batch. Neither process can guarantee flush after SIGKILL.

## Retention: provider defaults

No workspace retention, Application Insights component retention, table retention or archive override is configured by this change. There are no custom table-retention resources. This follows the user's corrected instruction to leave retention at Azure/provider defaults.

Azure documents **30 days as the general Log Analytics workspace/table default**, with separate **90-day defaults for Application Insights tables**, including AppRequests, AppTraces, AppDependencies, AppExceptions and AppMetrics. These defaults are distinct; the workspace default must not be presented as the App table default. Inspect the actual deployed workspace and tables because existing overrides and service behavior may differ. Standard/preaggregated metric-store retention is separate from Log Analytics table retention; this change does not configure it or promise a deletion deadline for metrics. Lowering retention within an included period would not reduce ingestion charges. Sampling and volume controls are the relevant ingestion cost controls.

## Verification and operational queries

`go test ./...` includes `TestOTLPActualServerExportsPrivateCorrelatedSignals`: actual HTTP requests create/read a list and create/edit an item in JSONL storage, exercise validation and unknown routes, stream the real MCP SSE endpoint, then inspect all three OTLP protobuf exports for privacy and correlation. Unit tests also exercise disabled/invalid configuration, zero sampling, 401/503 receivers, stalled receiver deadlines and panic privacy/semantics.

`bash scripts/check-observability.sh` downloads the pinned Linux amd64 Collector and verifies its release checksum, validates the deployed config, then runs `scripts/test-observability-pipeline.py`. That script builds the actual Go server, uses temporary JSONL storage and an Application Insights ingestion stub, confirms RequestData/MessageData/MetricData, errors, log/span correlation and secret exclusion, then sends real SIGTERM and checks a clean exit. All its generated files are below TMPDIR. CI runs this check alongside the normal backend and Bicep checks. The fake connection string is a zero key pointing only to loopback, never to Azure.

After an authorized Azure deployment, an operator should verify all three signal counts and join operation IDs (allow ingestion latency):

```kusto
AppRequests | where AppRoleName == "togetherlist-backend" | summarize count() by Name, ResultCode
AppTraces | where AppRoleName == "togetherlist-backend" | summarize count() by OperationId
AppMetrics | where AppRoleName == "togetherlist-backend" | summarize count() by Name
```

Use the workspace Tables view or a retention-only CLI query to inspect current defaults/overrides without printing credentials:

```bash
az monitor log-analytics workspace table list \
  --resource-group <group> --workspace-name <workspace> \
  --query '[?starts_with(name, `App`)].{table:name,analytics:retentionInDays,total:totalRetentionInDays}'
```

Live Azure provisioning/ingestion/RBAC/network access, resource region availability, observed retention values and portal queries require an authorized subscription and deployment. Local Collector conversion and Bicep compilation cannot prove these cloud behaviors. No cloud creation/deployment is part of this task. The environment has no Docker daemon; a static Linux Go build and exact Collector binary validation cover the executable/configuration paths, while the existing image build remains CI validation.

## Authoritative sources checked 2026-10-24

- [OTel Go exporters](https://opentelemetry.io/docs/languages/go/exporters/): standard OTLP SDKs for the three signals.
- [Pinned contrib Azure Monitor exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/v0.147.0/exporter/azuremonitorexporter/README.md): beta logs/metrics/traces, mapping and queue/shutdown configuration. This is community maintained; it is not an invented or Microsoft-supported Azure Go exporter.
- [Official Azure native OTLP ingestion](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/opentelemetry-protocol-ingestion): alternative native OTLP path, DCR/DCE plus LAW/AMW, authentication and metric aggregation requirements. That path uses different storage and is not silently substituted here.
- [Azure OpenTelemetry options and preview limitations](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/collect-use-observability-data).
- [Azure data retention](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/data-retention-configure): workspace defaults, App table defaults, distinct total retention and included retention pricing.
- [Azure metrics storage](https://learn.microsoft.com/en-us/azure/azure-monitor/metrics/data-platform-metrics): metric storage is separate from Log Analytics.
- [Application Insights FAQ](https://learn.microsoft.com/en-us/azure/azure-monitor/app/application-insights-faq): supported Microsoft distro languages, ingestion latency and workspace billing.
