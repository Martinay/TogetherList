# Implement Real-time Updates (Polling)

## Goal
Implement automatic polling to keep the list in sync across users.

## Scope
- **Directory**: `frontend/`
- **Files**: `frontend/src/hooks/**`, `frontend/src/pages/ListPage.tsx`

## Context
- **Vision**: Real-time updates propagate to other users.
- **Implementation**: Polling approach (simple, no WebSocket).
- **Prerequisite**: Task 0014 (Item Actions) completed.

## Granular Instructions
- [ ] Create `src/hooks/usePolling.ts`:
    - Configurable interval (e.g., 3 seconds).
    - Fetch list state periodically.
    - Smart diffing to avoid UI flicker.
- [ ] Integrate into `ListPage.tsx`:
    - Enable polling when page is visible.
    - Pause when tab is hidden (visibility API).
- [ ] Handle conflicts gracefully:
    - Don't override user's in-progress edits.
- [ ] Add visual indicator for "last updated".
- [ ] Add tests for polling logic.

## Definition of Done
- [ ] List auto-updates with changes from other users.
- [ ] Polling pauses when tab hidden.
- [ ] Automated Tests passing.
- [ ] `status.md` updated.
- [ ] Next Task created.
