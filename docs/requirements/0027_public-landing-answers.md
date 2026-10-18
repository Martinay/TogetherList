---
id: REQ-0027
status: Proposed
type: NonFunctional
priority: P1
source: User request for landing MCP visibility and accurate SEO/GEO
created: 2026-10-15
updated: 2026-10-15
links:
  adr: [0025]
  requirements: [0019, 0026]
tags: [landing, discovery, mcp, privacy]
---

# REQ-0027: Consistent public landing answers

## Context

People, search crawlers and answer engines need consistent public product information, including a useful MCP handoff and the boundary between public documentation and shared-list access.

## Requirement (EARS)

When a visitor or crawler requests public landing information, the system shall present consistent, factual descriptions of shared-list and supported MCP behavior without exposing list contents through public discovery metadata.

## Rationale

Visible answer-first information and matching structured answers help readers assess the product. This does not promise search rankings or imply unsupported client compatibility.

## Acceptance Criteria

- Human and crawler landing pages describe the same supported capabilities and link/ID access warning.
- FAQ schema questions and answers match visible FAQ text.
- Legacy HTTP/SSE setup uses `/api/v1/mcp/sse`; direct JSON-RPC POST is explicitly distinguished from Streamable HTTP.
- No global list enumeration is advertised; no public list data appears in schema, sitemap or LLM documents.
- List shells use noindex and carry no homepage canonical, FAQ schema or social metadata.
- Existing locale selection continues working with clean English fallback for revised copy.

## Verification

Production browser/server landing parity tests, existing MCP tool/SSE/browser tests and backend crawler/cache tests; manual responsive and translation review.

## Dependencies and Relationships

- [MCP requirement](0019_mcp_server.md)
- [Analytics privacy boundary](0026_analytics-privacy-boundary.md)
- [MCP architecture](../adr/0025_mcp_server.md)
- [Implementation and handoff](../tasks/0033_landing-agentic-seo.md)
