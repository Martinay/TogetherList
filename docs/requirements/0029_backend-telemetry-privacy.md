---
id: REQ-0029
status: Proposed
type: Constraint
priority: P0
source: User request for backend observability privacy
created: 2026-10-24
updated: 2026-10-24
links:
  adr: [0028_backend-observability.md]
  requirements: [0028_backend-observability.md]
tags: [backend, privacy]
---

# REQ-0029: Backend telemetry privacy boundary

## Context

List URLs are bearer capabilities. User content and identity cannot become diagnostic dimensions or log messages.

## Requirement (EARS)

When backend telemetry is exported, the system shall restrict request telemetry to registered route templates, normalized HTTP methods, status codes, numeric durations, generated trace identifiers, fixed messages, and the fixed backend service identity.

## Rationale

An explicit allowlist prevents accidental content collection and bounds metric cardinality.

## Acceptance Criteria

- No raw list/item URLs or IDs, query strings, bodies, names, descriptions, tokens, cookies, user agents, client addresses, baggage, tracestate or exception messages/stacks cross the OTLP boundary.
- Resource environment attributes are removed before transmission, even when the SDK merges them into an explicitly configured resource.
- Unknown routes and arbitrary methods use fixed labels. Mux-generated redirects cannot become raw route dimensions.
- Incoming remote trace context cannot force sampling or inject telemetry attributes.
- No browser instrumentation is added by this backend feature.
- Azure connection strings use secure Bicep outputs and Container Apps secret references; diagnostic failure messages omit raw errors.

## Verification

Actual server/OTLP integration uses content, capability, header, query and environment canaries, verifies correlation and inspects all signals. Panic tests verify rethrow semantics without exception content. The Collector pipeline test repeats privacy/correlation assertions on Application Insights envelopes.

## Dependencies and Relationships

- [Backend observability](0028_backend-observability.md)
- [Proposed architecture](../adr/0028_backend-observability.md)
