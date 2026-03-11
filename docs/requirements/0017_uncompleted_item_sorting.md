---
id: REQ-0017
status: Implemented
type: Functional
priority: P1
source: https://github.com/Martinay/TogetherList/pull/15
created: 2026-03-11
updated: 2026-03-11
links:
  adr: []
  requirements: [REQ-0006, REQ-0009]
tags: [sorting, uncompleted, preferences, localstorage]
---

# REQ-0017: Sort Uncompleted Items with Saved Per-List Preference

## Context

As lists grow, users need predictable ordering for uncompleted items.
Different users and situations require different sort modes (e.g. newest first for fast capture, A-Z for scanning).
The selected mode should survive page reloads without requiring account-based settings.

## Requirement (EARS)

**Pattern:** Ubiquitous

**Statement:**  
The system shall allow users to sort the uncompleted items section using predefined sort modes and persist the selected mode per list in local storage.

## Supported Sort Modes

- Newest first (default)
- Oldest first
- A-Z
- Z-A

## Rationale

- Improves readability for long lists
- Reduces friction by remembering user choice
- Maintains stable, expected behavior for completed items

## Acceptance Criteria

- Given a list with multiple uncompleted items
- When the list is opened for the first time
- Then uncompleted items are shown in newest-first order by default

- Given a user selects a different sort mode
- When the uncompleted section is rendered
- Then items are ordered according to the selected mode

- Given a user has selected a sort mode for a specific list
- When the page is reloaded
- Then the same mode is restored for that list

- Given a list contains completed items
- When uncompleted sort mode is changed
- Then completed items remain sorted by completion timestamp descending

## Verification

- Method: Test
- Evidence:
  - Unit tests for sorting and persistence helpers
  - List page rendering tests for default ordering, persistence, and completed-section stability
  - E2E test for mode switching and reload persistence

## Dependencies and Relationships

- Related requirements: REQ-0006 (Item Creation), REQ-0009 (Item Completion)
- Constraining ADRs: None
- Impacted components: List page UI, localStorage integration, sorting helper utilities

## Notes

Implemented in PR #15: https://github.com/Martinay/TogetherList/pull/15
