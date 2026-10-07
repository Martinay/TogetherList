---
id: REQ-0025
status: Proposed
type: Functional
priority: P1
source: User request for Microsoft Clarity
created: 2026-10-07
updated: 2026-10-07
links:
  adr: [0027]
  requirements: [0018]
tags: [privacy, analytics]
---

# REQ-0025: Optional analytics consent

## Context

TogetherList may use Microsoft Clarity for product improvement. Shared list URLs grant access and their contents must remain private.

## Requirement (EARS)

When a visitor chooses optional analytics, the system shall apply the visitor's explicit, revocable browser-local consent before loading Microsoft Clarity.

## Rationale

A decline must prevent even cookieless analytics; storage failures must not silently grant consent.

## Acceptance Criteria

- No choice or decline: no SDK loading.
- Accept/decline persist across reloads, with both choices always accessible and status announced.
- Revocation terminates a recording document and clears first-party Clarity cookies; other tabs observe stored changes.
- Failed acceptance storage leaves analytics off; failed revocation storage leaves the recording document for the excluded privacy route.
- All 21 languages provide disclosure and controls, including Arabic directionality.
- Development and test builds cannot load Clarity.

## Verification

Unit tests in `clarity.test.ts` and `privacy-controls.test.tsx`; real browser consent, storage and offline scenarios in `privacy.e2e.test.ts`.

## Dependencies and Relationships

[Proposed privacy boundary ADR](../adr/0027_public-page-analytics.md), [language support](0018_language_support.md), [draft task](../tasks/0031_clarity-analytics.md).
