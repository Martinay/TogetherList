---
id: REQ-0002
status: Proposed
type: Functional
priority: P0
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0004, REQ-0013]
tags: [list, creation, landing-page, participants]
---

# REQ-0002: List Creation

## Context

The application enables users to create shared lists for organizing and assigning items.
Before a list is created, the creator must identify themselves and define the participants who will use the list.
Each list must be uniquely identifiable to allow sharing and independent access.

## Requirement (EARS)

**Pattern:** Event-driven

**Statement:**  
When a user requests to create a new list, the system shall first prompt the user to enter their own name, then allow the user to add names of other participants, and only after participants are defined shall the system generate a unique UUID and redirect to `/list/<uuid>`.

## Rationale

Collecting participant names upfront:
- Establishes the list of available names for identity selection (REQ-0004)
- Enables assignment to predefined participants (REQ-0008)
- Creates a smoother collaborative experience

Unique identifiers (UUIDs) prevent collisions and enumeration attacks.

## Acceptance Criteria

- Given a user is on the landing page
- When the user clicks "Create a new list"
- Then the system prompts for the user's own name

- Given the user has entered their own name
- When the user submits
- Then the system allows adding additional participant names

- Given participants have been defined
- When the user confirms list creation
- Then a new UUID is generated, participants are stored, and the user is redirected to `/list/<generated-uuid>`

## Verification

- Method: Test
- Evidence: Automated test confirming name entry flow, participant addition, UUID generation, and redirect

## Dependencies and Relationships

- Related requirements: REQ-0003 (List Sharing), REQ-0004 (User Identity), REQ-0013 (Participant Management)
- Constraining ADRs: None
- Impacted components: Landing page, list creation wizard, list creation API

## Notes

The `ListCreated` event must include the initial participant list.
A `UserJoined` event should be recorded for each participant.
