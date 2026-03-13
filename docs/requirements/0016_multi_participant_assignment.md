# REQ-0016 — Multi-participant item assignment

## User Story
As a participant in a TogetherList list, I want to assign one or more participants to an item (and clear assignment later), so that responsibility can be shared and updated as work changes.

## Product Goal
Improve collaboration clarity by supporting shared ownership of list items while keeping assignment interactions simple and consistent.

## Scope
- In scope:
  - Support assigning multiple participants to a single item.
  - Support clearing all assignees from an item.
  - Allow any participant to assign/reassign/clear assignees.
  - Expose assignment controls inside item details.
  - Persist assignment changes and broadcast updates to connected clients.
- Out of scope:
  - Role-based permissions for assignment.
  - Assignment notifications.
  - Due dates, workload balancing, or assignment suggestions.
  - Sorting/filtering changes beyond preserving current behavior.

## Key Decisions (Confirmed)
- Multiple participants are allowed per item.
- Assignment can be cleared later.
- Any participant can assign/reassign/clear.
- Assignment UI lives inside item details.

## Open Questions
- Should participant display order follow list participant order or assignment timestamp order?

## Functional Requirements
- FR1 — The system shall allow selecting multiple participants for a single item from the predefined participant list of that list.
- FR2 — The system shall allow removing one assigned participant from an item without affecting other assignees.
- FR3 — The system shall allow clearing all assignees from an item.
- FR4 — The assignment editor shall be available inside item details.
- FR5 — Any participant with access to the list can change assignment on any item.
- FR6 — Assignment updates shall persist and be visible to all users after refresh and via normal sync flow.
- FR7 — Existing items with legacy single-value assignment data (if present) shall be rendered and migrated/normalized safely to the new multi-assignee representation.

## UX Requirements
- Keep interactions simple and obvious.
- Avoid unnecessary controls/settings.
- Mobile-friendly behavior.
- In item details, use a compact multi-select pattern (checkbox list, token picker, or equivalent) that clearly shows selected assignees.
- Provide a clear “Clear assignment” action.
- In collapsed item view, show assignee summary (e.g., avatars/chips/names) with graceful truncation for many assignees.

## Engineering Notes (for coding agent)
- Affected components:
  - Frontend: `ListItem` details panel, list item summary rendering, API client types.
  - Backend: item update/assignment endpoint handling, aggregate/event model, serialization.
  - Tests: frontend unit/integration + backend unit + E2E assignment flow.
- Data model/API impact:
  - Replace `assigned_to: string` with `assigned_to: string[]` (or add `assigned_to_list: string[]` with compatibility handling).
  - API contract for assignment updates must accept array payloads and empty array for clear.
- Persistence behavior:
  - Persist assignment as array in event/data store.
  - On read, normalize legacy single-string values to array (`"Alice" -> ["Alice"]`, empty -> `[]`).
- Edge cases:
  - Duplicate participant names in payload must be rejected or de-duplicated deterministically.
  - Unknown participant names must be rejected.
  - Completed items should keep existing completion behavior; assignment editing policy for completed items should remain consistent with existing edit rules.
  - Concurrent edits: last-write-wins consistent with current item update semantics.

## Acceptance Criteria (Given/When/Then)
1. Given a list with participants Alice, Bob, and Carol, when a user opens item details and selects Alice and Bob as assignees, then the item shows both assignees and persists after reload.
2. Given an item assigned to Alice and Bob, when a user removes Bob in item details, then only Alice remains assigned.
3. Given an item assigned to multiple participants, when a user clicks “Clear assignment,” then the item becomes unassigned.
4. Given any participant user identity, when they edit assignees on any item, then the update succeeds and is visible to other users after sync.
5. Given a legacy item with single-string assignment data, when the item is loaded, then assignment is represented correctly in the new multi-assignee UI without errors.

## Definition of Done
- Feature implemented per requirements.
- Unit tests added/updated for behavior and edge cases (frontend + backend).
- E2E test(s) added for critical multi-assignee flow (assign, remove one, clear all, cross-client visibility).
- No regressions in related areas.
- Documentation/i18n updates (if applicable).
