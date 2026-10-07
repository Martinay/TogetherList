---
id: REQ-0026
status: Proposed
type: Constraint
priority: P0
source: User request for Microsoft Clarity
created: 2026-10-07
updated: 2026-10-07
links:
  adr: [0027]
  requirements: [0025]
tags: [privacy, analytics]
---

# REQ-0026: Analytics privacy boundary

## Context

Clarity content masking does not sanitize private URLs or referrers. TogetherList uses secret list links and browser-cached private data.

## Requirement (EARS)

While optional analytics is enabled, the system shall exclude private user content and private list access tokens from analytics collection.

## Rationale

A conservative public-page boundary avoids exposing capabilities or participant/list/item names to third-party recording.

## Acceptance Criteria

- Only fresh production landing documents with no saved lists, query, fragment or potentially private referrer are eligible.
- A SPA return from private routes never activates the SDK; creation opens a fresh document from the landing page.
- No identify calls, custom tags, private links or saved-list content in recording documents.
- Root content is explicitly masked; advertising storage remains denied.
- Privacy policy describes behavioral metrics, heatmaps, session replay, first/third-party cookies and tracking for product improvement, with the Microsoft privacy link.
- Visible disclosure and own privacy policy are reachable from landing and application, online and cached offline.

## Verification

Unit URL/referrer/storage boundary tests, real production frontend/Go/JSONL E2E consent and list tests; manual production recording audit remains a documented gap.

## Dependencies and Relationships

[Consent requirement](0025_optional-analytics-consent.md), [Proposed ADR](../adr/0027_public-page-analytics.md).
