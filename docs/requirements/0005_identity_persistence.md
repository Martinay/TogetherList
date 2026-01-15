---
id: REQ-0005
status: Implemented
type: Functional
priority: P1
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0004]
tags: [identity, persistence, localstorage, per-list]
---

# REQ-0005: Identity Persistence in LocalStorage

## Context

Once a user selects their display name, the application should remember it for future visits to the same list.
This avoids requiring the user to re-select their name every time they access the same list.
Browser LocalStorage provides a simple, client-side persistence mechanism.
Names are stored per list, allowing the same user to have different identities in different lists.

## Requirement (EARS)

**Pattern:** State-driven

**Statement:**  
While a user has a display name stored in browser LocalStorage for a specific list, the system shall use that name for all interactions with that list without re-prompting.

## Rationale

Per-list LocalStorage persistence:
- Improves user experience by reducing repetitive prompts
- Requires no server-side session management
- Allows users to participate as different identities in different lists
- Aligns with the stateless, simple architecture

The trade-off is that clearing browser data or using a different device will reset the identity.

## Acceptance Criteria

- Given a user has previously selected a display name for a specific list
- When the user returns to the same list in the same browser
- Then the system uses the stored name without prompting

- Given a user participates in multiple lists with different names
- When the user accesses each list
- Then the correct name for each list is retrieved independently

## Verification

- Method: Test
- Evidence: Automated test confirming per-list LocalStorage retrieval and prompt bypass

## Dependencies and Relationships

- Related requirements: REQ-0004 (User Identity)
- Constraining ADRs: None
- Impacted components: Frontend identity management, LocalStorage handling

## Notes

Storage key format: `list:<uuid>:username` to ensure per-list scoping.
