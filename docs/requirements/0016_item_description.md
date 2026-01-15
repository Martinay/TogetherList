---
id: REQ-0016
status: Proposed
type: Functional
priority: P1
source: User request
created: 2026-01-15
updated: 2026-01-15
links:
  adr: []
  requirements: [REQ-0006, REQ-0015]
tags: [item, description, editing]
---

# REQ-0016: Item Description

## Context

Items currently only have a title. Users need the ability to add more detailed information about an item, such as notes, instructions, or additional context.
The description is optional and can be edited by any participant.
A preview of the description (first 2 lines) is shown in the collapsed item view.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When a user edits an item's description, the system shall update and persist the description.

## Rationale

Item descriptions:
- Allow users to add context beyond the title (e.g., "Buy milk" → "Get 2% organic from Trader Joe's")
- Support collaborative clarification — anyone can add details
- 2-line preview in collapsed view helps users quickly scan important notes
- Generates an `ItemDescriptionEdited` event for audit and sync

## Acceptance Criteria

- Given a user has expanded an item's details view
- When the user enters or modifies text in the description field
- Then the description is auto-saved after a brief pause (debounce)
- And a save status indicator is displayed (Saving... → ✓ Saved)

- Given an item has a description
- When the item is collapsed
- Then the first 2 lines of the description are shown in a smaller font below the title

- Given an item has no description
- When the item is collapsed
- Then no description preview is shown

## Verification

- Method: Test
- Evidence: Automated test confirming description persistence, event generation, and preview display

## Dependencies and Relationships

- Related requirements: REQ-0006 (Item Creation), REQ-0007 (Item Title Editing), REQ-0015 (Item Details View)
- Constraining ADRs: None
- Impacted components: List page UI, item detail component, description API, event log

## Notes

- The `ItemDescriptionEdited` event must include the item ID and new description text.
- Description field should be a multi-line textarea.
- Auto-save with debounce (e.g., 500ms after typing stops).
- Save status feedback:
  - `Saving...` while API call in progress
  - `✓ Saved` on success (fade after 2-3 seconds)
  - `⚠ Failed to save` on error (persist until retry succeeds)
