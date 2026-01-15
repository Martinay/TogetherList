---
id: REQ-0013
status: Proposed
type: Functional
priority: P1
source: User feedback (2026-01-09)
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0002]
tags: [participants, list, management]
---

# REQ-0013: Participant Definition

## Context

During list creation, the creator defines who can participate in the list.
This participant list serves as the source of available names for identity selection (REQ-0004) and item assignment (REQ-0008).
The creator's own name is always the first participant.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When creating a new list, the system shall require the creator to enter their own name first, then allow adding additional participant names before the list is created.

## Rationale

Upfront participant definition:
- Creates a bounded set of identities for consistent name usage
- Enables selection-based identity (no typos or duplicates)
- Supports assignment to known participants
- Provides visibility into who is expected to participate

## Acceptance Criteria

- Given a user initiates list creation
- When the system prompts for participants
- Then the creator must enter their own name first

- Given the creator has entered their name
- When adding participants
- Then the system allows adding zero or more additional participant names

- Given participants have been defined
- When the list is created
- Then all participant names are stored and available for identity selection

## Verification

- Method: Test
- Evidence: Automated test confirming participant entry flow and storage

## Dependencies and Relationships

- Related requirements: REQ-0002 (List Creation), REQ-0004 (User Identity), REQ-0008 (Item Assignment), REQ-0014 (Unique Names)
- Constraining ADRs: None
- Impacted components: List creation wizard, participant storage, API

## Notes

Consider whether participants can be added after list creation (future enhancement).
