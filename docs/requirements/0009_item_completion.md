---
id: REQ-0009
status: Proposed
type: Functional
priority: P0
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0006]
tags: [item, completion, status]
---

# REQ-0009: Item Completion

## Context

The primary purpose of a list is to track progress.
Users must be able to mark items as completed (done) to indicate they are finished.
Items should also be able to be unmarked if completed in error.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When a user marks an item as complete or incomplete, the system shall update the item's completion status accordingly.

## Rationale

Completion tracking:
- Provides visual feedback on progress
- Enables filtering or sorting by status
- Core functionality for task/list management

Supporting both completion and un-completion increases flexibility.

## Acceptance Criteria

- Given a user is viewing a list with items
- When the user marks an item as complete
- Then the item displays as completed (e.g., with a checkmark or strikethrough)

- Given a user is viewing a list with a completed item
- When the user marks the item as incomplete
- Then the item displays as not completed

## Verification

- Method: Test
- Evidence: Automated test confirming status toggle and visual update

## Dependencies and Relationships

- Related requirements: REQ-0006 (Item Creation)
- Constraining ADRs: None
- Impacted components: List page UI, item update API, event log

## Notes

The `ItemCompleted` event includes item ID and `is_completed` boolean.
