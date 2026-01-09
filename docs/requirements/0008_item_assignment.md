---
id: REQ-0008
status: Proposed
type: Functional
priority: P1
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0002, REQ-0006]
tags: [item, assignment, responsibility, participants]
---

# REQ-0008: Item Assignment

## Context

Lists are often collaborative, with different people responsible for different items.
The application supports assigning items to participant names defined during list creation.
This ensures consistency and enables filtering by assignee.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When a user assigns an item, the system shall allow selection from the list of available participant names and update the item's assignment accordingly.

## Rationale

Restricting assignment to participant names:
- Ensures consistency with the defined participant list
- Enables reliable filtering and grouping by assignee
- Reduces typos and duplicate name variants
- Keeps the initial implementation simple

Arbitrary string assignment can be added as a future enhancement.

## Acceptance Criteria

- Given a user is viewing a list with items
- When the user initiates item assignment
- Then the system displays the list of available participant names for selection

- Given the assignment UI is displayed
- When the user selects a participant name
- Then the item is assigned to that participant

## Verification

- Method: Test
- Evidence: Automated test confirming participant selection and assignment

## Dependencies and Relationships

- Related requirements: REQ-0002 (List Creation w/ participants), REQ-0006 (Item Creation)
- Constraining ADRs: None
- Impacted components: List page UI, assignment dropdown, item update API, event log

## Notes

The `ItemAssigned` event must include the item ID and assigned participant name. Empty string clears assignment.
Future enhancement: allow arbitrary string values for categories.
