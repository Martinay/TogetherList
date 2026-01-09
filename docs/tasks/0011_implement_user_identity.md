# Implement User Identity (Display Name)

## Goal
Implement the simple identity system: prompt for display name and persist in LocalStorage.

## Scope
- **Directory**: `frontend/`
- **Files**: `frontend/src/components/**`, `frontend/src/hooks/**`

## Context
- **PDR**: No Auth - Users identify by display name only.
- **Persistence**: Name stored in browser's LocalStorage.
- **Behavior**: Prompt on first visit to a list if no name set.

## Granular Instructions
- [ ] Create `src/hooks/useUserIdentity.ts`:
    - Read/write display name from LocalStorage.
    - Return `{ displayName, setDisplayName, isSet }`.
- [ ] Create `src/components/NamePrompt.tsx`:
    - Modal/dialog asking for display name.
    - Save to LocalStorage on submit.
- [ ] Integrate into `ListPage.tsx`:
    - Show prompt if no name set.
    - Pass name to API calls.
- [ ] Style with premium feel (Vibe Coding).
- [ ] Add tests for hook and component.

## Definition of Done
- [ ] User can enter and persist display name.
- [ ] Name persists across page refreshes.
- [ ] Automated Tests passing.
- [ ] `status.md` updated.
- [ ] Next Task created.
