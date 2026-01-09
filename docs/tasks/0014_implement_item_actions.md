# Implement Item Actions (Edit, Assign, Complete)

## Goal
Allow users to edit, assign, and complete items in the list.

## Scope
- **Directory**: `frontend/`
- **Files**: `frontend/src/components/**`

## Context
- **Prerequisite**: Task 0013 (Add Item UI) completed.
- **API**: PATCH /api/lists/{id}/items/{item_id}

## Granular Instructions
- [ ] Implement completion toggle:
    - Click checkbox calls API with `is_completed: true/false`.
    - Optimistic UI update.
- [ ] Implement edit title:
    - Click title to enter edit mode.
    - Save on blur or Enter key.
- [ ] Implement assign:
    - Dropdown or input to set `assigned_to`.
    - Show current assignment.
- [ ] Create `src/hooks/useUpdateItem.ts` for API calls.
- [ ] Add micro-animations for state changes.
- [ ] Add tests.

## Definition of Done
- [ ] Can toggle item completion.
- [ ] Can edit item title inline.
- [ ] Can assign item to person.
- [ ] Automated Tests passing.
- [ ] `status.md` updated.
- [ ] Next Task created.
