---
id: REQ-0007
status: Implemented
type: Functional
priority: P1
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0006]
tags: [item, editing, title]
---

# REQ-0007: Item Title Editing

## Context

Users may need to correct typos or update item descriptions after creation.
The application must support editing item titles without requiring deletion and recreation.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When a user edits an item's title, the system shall update the item with the new title.

## Rationale

Title editing:
- Improves usability by allowing corrections
- Preserves item identity (ID remains unchanged)
- Generates an `ItemTitleEdited` event for audit and sync

## Acceptance Criteria

- Given a user is viewing a list with existing items
- When the user edits an item's title and saves the change
- Then the item displays the updated title

## Verification

- Method: Test
- Evidence: Automated test confirming title update and event persistence

## Dependencies and Relationships

- Related requirements: REQ-0006 (Item Creation)
- Constraining ADRs: None
- Impacted components: List page UI, item update API, event log

## Notes

The `ItemTitleEdited` event must include the item ID and new title.
