---
id: REQ-0011
status: Implemented
type: NonFunctional
priority: P0
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0012]
tags: [architecture, event-sourcing, state]
---

# REQ-0011: Event Sourcing Architecture

## Context

The application uses event sourcing as its core architectural pattern.
Rather than storing the current state directly, the system stores a sequence of immutable events.
Current state is derived by replaying these events.

## Requirement (EARS)

**Pattern:** Ubiquitous

**Statement:**  
The system shall derive the current state of each list entirely from a sequence of immutable events.

## Rationale

Event sourcing provides:
- Complete audit trail of all changes
- Ability to reconstruct state at any point in time
- Simplified synchronization (clients can replay events)
- Natural fit for collaborative, real-time applications

The trade-off is increased complexity in state reconstruction, which is acceptable for this use case.

## Acceptance Criteria

- Given a list has been modified through various actions
- When the system reconstructs the list state
- Then the state matches the result of replaying all events in order

## Verification

- Method: Test
- Evidence: Automated test confirming state reconstruction from event log matches expected state

## Dependencies and Relationships

- Related requirements: REQ-0012 (JSONL Storage)
- Constraining ADRs: ADR-0003 (Backend Tech) if applicable
- Impacted components: Backend event store, state reconstruction logic

## Notes

Event types: ListCreated, UserJoined, ItemAdded, ItemCompleted, ItemAssigned, ItemTitleEdited.
