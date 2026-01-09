---
id: REQ-0006
status: Proposed
type: Functional
priority: P0
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: []
tags: [item, creation, list]
---

# REQ-0006: Item Creation

## Context

The primary function of the application is to manage list items.
Users must be able to add new items to a list to organize tasks, groceries, or other things.
Each item requires at minimum a title to identify it.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When a user submits a new item with a title, the system shall add the item to the list and generate a unique item ID.

## Rationale

Item creation is a core feature:
- Enables the fundamental use case of list management
- Unique item IDs support event sourcing (ItemAdded, ItemCompleted, etc.)
- Titles provide human-readable identification

## Acceptance Criteria

- Given a user is viewing a list
- When the user enters a title and submits a new item
- Then the item appears in the list with the entered title and a unique ID

## Verification

- Method: Test
- Evidence: Automated test confirming item creation, ID generation, and list update

## Dependencies and Relationships

- Related requirements: REQ-0007 (Item Editing), REQ-0008 (Item Assignment), REQ-0009 (Item Completion)
- Constraining ADRs: None
- Impacted components: List page UI, item creation API, event log

## Notes

The `ItemAdded` event must be persisted with the item ID and title.
