---
id: REQ-0024
status: Proposed
type: Functional
priority: P1
source: User-requested pull-to-refresh feature
created: 2026-10-07
updated: 2026-10-07
links:
  adr: [0008_state_sync_strategy, 0026_durable-offline-sync]
  requirements: [REQ-0020]
tags: [frontend, refresh]
---

# REQ-0024: Pull to refresh a todo list

## Context

Users need a deliberate way to refresh a displayed list on touch devices while retaining offline edits and ordinary list interactions.

## Requirement (EARS)

When a user releases a single-finger downward pull of at least 72 CSS pixels that began on a non-interactive part of a displayed todo list at scroll top, the system shall refresh the list through its existing offline-aware synchronization path.

## Acceptance Criteria

- Empty and short lists support the gesture without needing scrollable content.
- The page and every ancestor scroller of the touched element remain at the top throughout the gesture.
- Upward, horizontal, short, reversed, canceled, and multi-touch gestures do not refresh.
- Gestures originating on buttons, links, labels, editable fields, or focusable controls retain their normal behavior.
- Pull and release hints, loading feedback, and refresh failure feedback use translations; refresh exposes busy state.
- Manual refresh and polling share a guarded replay-before-fetch operation. Overlapping refreshes coalesce.
- Offline snapshots and pending edits retain the loader's existing projection/replay behavior; refreshing never reloads the browser.
- Errors retain visible list content, release the busy guard, and permit another pull.
- Idle gesture feedback does not add a status region that interferes with offline feedback.

## Verification

Automated component and list integration tests, existing offline regression tests, and device verification. See [verification evidence](../pull-to-refresh-verification.md).

## Dependencies and Relationships

- [Offline list viewing](0020_offline-list-access.md)
- [State synchronization](../adr/0008_state_sync_strategy.md)
- [Durable offline synchronization](../adr/0026_durable-offline-sync.md)

## Notes

Proposed; user acceptance and physical-device verification remain pending. This follows the existing architecture and introduces no new architecture decision.
