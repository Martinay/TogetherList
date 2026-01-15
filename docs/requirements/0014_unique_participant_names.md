---
id: REQ-0014
status: Proposed
type: Constraint
priority: P1
source: User feedback (2026-01-15)
created: 2026-01-15
updated: 2026-01-15
links:
  adr: []
  requirements: [REQ-0013]
tags: [participants, validation, uniqueness]
---

# REQ-0014: Unique Participant Names

## Context

During list creation, participants are defined by name. These names are used for identity selection (REQ-0004) and item assignment (REQ-0008).
Duplicate names would cause ambiguity when selecting identities or assigning items, making it impossible to distinguish between participants.

## Requirement (EARS)

**Pattern:** State-driven

**Statement:**  
While a user is adding participant names during list creation, the system shall prevent the entry of duplicate names and display a validation error when a duplicate is attempted.

## Rationale

Enforcing name uniqueness:
- Prevents ambiguity in identity selection
- Ensures clear responsibility assignment
- Provides immediate user feedback rather than silent rejection
- Maintains data integrity for participant-based operations

## Acceptance Criteria

- Given a user is adding participants
- When the user attempts to add a name that already exists in the participant list
- Then the system displays a validation error message

- Given a user is adding participants
- When the user attempts to add a name matching the creator's name
- Then the system displays a validation error message

- Given a validation error is displayed
- When the user modifies the input field
- Then the validation error is cleared

## Verification

- Method: Test
- Evidence: Automated test confirming duplicate prevention and error display

## Dependencies and Relationships

- Related requirements: REQ-0013 (Participant Definition), REQ-0004 (User Identity), REQ-0008 (Item Assignment)
- Constraining ADRs: None
- Impacted components: List creation wizard (frontend), createlist handler (backend)

## Notes

Comparison for uniqueness should be case-sensitive to allow names like "Bob" and "bob" as separate participants if desired.
