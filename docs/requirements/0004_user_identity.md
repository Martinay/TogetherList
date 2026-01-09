---
id: REQ-0004
status: Proposed
type: Functional
priority: P1
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0002, REQ-0005]
tags: [identity, user, display-name, selection]
---

# REQ-0004: User Identity Selection

## Context

The application avoids traditional authentication to maximize simplicity.
When users access a list, they identify themselves by selecting from a predefined list of participant names.
The participant list is established during list creation (REQ-0002).
This name is used to attribute actions (e.g., item assignments) but does not enforce access control.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When a user accesses a list without a stored identity, the system shall display the list of available participant names and allow the user to select their name before allowing interaction with the list.

## Rationale

Name selection (vs. entry):
- Prevents typos and inconsistencies in names
- Provides a clear list of who is participating
- Simplifies assignment to known participants (REQ-0008)
- Maintains the "no complex auth" principle

This approach means only predefined participants can interact with a list.

## Acceptance Criteria

- Given a user navigates to a list page without a stored display name
- When the page loads
- Then the system displays the list of available participant names

- Given the list of participant names is displayed
- When the user clicks on their name
- Then the system stores the selected name and allows interaction with the list

## Verification

- Method: Test
- Evidence: Automated test confirming name list display and selection flow

## Dependencies and Relationships

- Related requirements: REQ-0002 (List Creation), REQ-0005 (Identity Persistence)
- Constraining ADRs: None
- Impacted components: List page, identity management, participant service

## Notes

The `UserJoined` event should be recorded when a user selects their name for a list.
