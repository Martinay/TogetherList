---
id: REQ-0022
status: Proposed
type: Functional
priority: P1
source: User offline-mode implementation request
created: 2026-10-07
updated: 2026-10-07
links:
  adr: ["../adr/0026_durable-offline-sync.md"]
  requirements: []
tags: [offline]
---

# REQ-0022: Safe offline replay

## Context

Shared-list users need continuity through temporary network interruptions on the same browser/device.

## Requirement (EARS)

When connectivity returns, the system shall automatically replay retained edits in list order without duplicate creations or silent loss of pending changes.

## Rationale

Make interruptions recoverable while keeping saved changes reviewable and preserving existing collaboration behavior.

## Acceptance Criteria

- Stable keys survive retries and duplicate item/list creation requests create one event.
- Transient errors use capped retries; permanent errors pause that list queue and remain visible.
- Same-field conflicts show saved/shared values and require explicit application of saved edits.
- Revision checks prevent racing writes.
- Storage transactions exclude network waits; replay calls coalesce within a tab and use a separate cross-tab replay lock without queued background runs.
- Acknowledgements and refreshes preserve concurrently queued operations.
- Rejected operations show HTTP status and error detail. Confirmed discard removes failed creations and their dependent item edits, retains independent later edits, and permits corrected resubmission with fresh IDs.
- Polling overlays queued edits; successful replay refreshes cached state.

## Verification

- Method: Automated unit/API tests and production WebDriver browser integration.
- Evidence: [Offline implementation task](../tasks/0027_implement-offline-mode.md).

## Dependencies and Relationships

- [Proposed offline architecture](../adr/0026_durable-offline-sync.md).
- Frontend offline feature and static shell; backend event storage for safe replay.
