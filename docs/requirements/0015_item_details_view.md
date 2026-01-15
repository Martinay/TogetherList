---
id: REQ-0015
status: Implemented
type: Functional
priority: P1
source: User request
created: 2026-01-15
updated: 2026-01-15
links:
  adr: []
  requirements: [REQ-0006]
tags: [item, details, view, accordion]
---

# REQ-0015: Item Details View

## Context

Users need to see additional information about list items beyond just the title.
This includes who created the item and when it was created.
The application uses an inline accordion pattern to expand/collapse item details without navigating away from the list.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When a user clicks on an item, the system shall expand the item to display the creator's name and creation timestamp.

## Rationale

Item details viewing:
- Provides transparency about who added an item and when
- Inline accordion keeps users in context (no page navigation)
- Supports collaborative workflows where knowing the creator matters
- Collapsed items can show a 2-line preview of the description for quick scanning

## Acceptance Criteria

- Given a user is viewing a list with items
- When the user clicks on an item row
- Then the item expands inline to show the creator's participant name and formatted creation timestamp

- Given an item is expanded
- When the user clicks on the item again (or a collapse control)
- Then the item collapses back to its compact view

## Verification

- Method: Test
- Evidence: Automated test confirming expand/collapse behavior and correct display of creator and timestamp

## Dependencies and Relationships

- Related requirements: REQ-0006 (Item Creation), REQ-0016 (Item Description)
- Constraining ADRs: None
- Impacted components: List page UI, item display component, ItemAdded event (must include creator)

## Notes

- The `ItemAdded` event must include the creator's participant ID to support this feature.
- When collapsed, the item may show a 2-line preview of the description in a smaller font.
- Multiple items can be expanded simultaneously (user controls their own view).
