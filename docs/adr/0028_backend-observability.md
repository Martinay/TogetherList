---
status: Proposed
date: 2026-10-24
deciders: [TogetherList maintainers]
---

# AD: Backend OTLP through a Collector sidecar

## Context and Problem Statement

Go needs backend logs, metrics and traces in Application Insights. Microsoft does not provide an Azure Monitor Go distro/exporter equivalent to its supported language distros. Capability-bearing list URLs and personal content make default HTTP instrumentation unsafe. The deployed Container Apps infrastructure must include the ingestion bridge.

## Decision Drivers

- Export all three signals with real local proof, no Azure requirement for developers.
- Preserve REST, MCP and SSE semantics, including flush and cancellation.
- Bound privacy exposure, cardinality, memory, shutdown time and cost.
- Keep Azure/Application Insights retention at provider defaults, per the user's corrected instruction.

## Considered Options

1. Standard Go OTLP SDK exporters plus the contrib Collector `azuremonitor` exporter.
2. Azure Monitor native OTLP ingestion through a Collector with Entra authentication.
3. A custom Go exporter for Application Insights ingestion.

### Option 1 cost evaluation

**Building (Development)**: Standard SDKs reduce authoring work and onboarding; explicit privacy filtering and local pipeline tests add modest maintenance. Small project scale is appropriate; AI assistance can use upstream APIs with pinned dependencies.

**Running (Operations)**: One 0.25 CPU/0.5 GiB sidecar adds runtime cost. Same Container App deployment avoids an extra service. Version upgrades and debugging are community-supported. Sampling and bounded queues limit ingestion and outage pressure.

**Externalities**: OTLP interoperates with other receivers. The contrib Azure exporter is beta for all three signals and community maintained, not a Microsoft-supported Go exporter. A connection string is stored as a secret, available only to the Collector. Classic ingestion uses local authentication.

### Option 2 cost evaluation

**Building (Development)**: Current official Azure documentation supports all three OTLP signals, but orchestration requires DCR/DCE, a Log Analytics workspace and an Azure Monitor workspace. More authoring, onboarding and review work for this project; AI assistance needs careful validation of preview schemas.

**Running (Operations)**: Additional resources, managed identity/RBAC and preview-specific dashboards increase deployment and debugging work. Native metrics use separate Azure Monitor workspace pricing and retention.

**Externalities**: Native OTLP and Entra identity improve interoperability and credential management. The Azure service path is preview; open-source Collector components still receive community support. Native OTLP tables differ from classic App tables.

### Option 3 cost evaluation

**Building (Development)**: Highest protocol/mapping implementation cost, no supported Microsoft Go exporter to reuse; onboarding and AI-generated protocol errors increase with project growth.

**Running (Operations)**: Could avoid a sidecar, but retries, buffering, ingestion changes and incident diagnosis become application maintenance responsibilities.

**Externalities**: Azure-specific coupling; custom privacy and credential handling expand security review. Poor interoperability compared with OTLP.

## Decision Outcome

Implement option 1: standard Go OTLP/HTTP exporters and pinned contrib Collector 0.147.0, with all three pipelines targeting the real Application Insights ingestion protocol. The exporter is beta/community maintained; this limitation is explicit. The deployed sidecar binds OTLP only on loopback and receives its connection string via a Container Apps secret. No host/file log collection or browser telemetry is introduced.

Manual server instrumentation uses registered templates and a final resource filter because the current SDK merges environment resources even with `WithResource`. Panic auto-recording is disabled. Root sampling avoids trusting anonymous clients' sampling decisions. Request logs follow trace sampling; metrics remain unsampled. Shutdown cancels streaming contexts and has a five-second HTTP budget plus a three-second parallel SDK flush budget.

Retention properties and table retention resources are deliberately absent. Azure controls defaults; workspace and Application Insights table defaults must not be conflated.

## Consequences

- Local tests prove backend OTLP and Collector conversion to correlated RequestData, MessageData and MetricData without Azure credentials.
- A single replica retains the existing storage topology; Collector consumes additional resources.
- Export loss is intentional under sustained outage, queue overflow, abrupt termination or sidecar shutdown races. This is diagnostics, not an audit log.
- There are no ordered sidecar shutdown guarantees in Container Apps; bounded flush is best effort.
- Live Azure provisioning, supported table schemas, ingestion and queries remain a deployment-owner validation step; no cloud resources were created for this change.
- [Requirements](../requirements/0028_backend-observability.md) and [privacy boundary](../requirements/0029_backend-telemetry-privacy.md) remain proposed pending user review.

## More Information

See [operations, exact sources and validation](../backend-observability.md).
