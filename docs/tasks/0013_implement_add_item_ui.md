# Implement Add Item UI

## Goal
Allow users to add new items to the list.

## Scope
- **Directory**: `frontend/`
- **Files**: `frontend/src/components/**`, `frontend/src/pages/ListPage.tsx`

## Context
- **Prerequisite**: Task 0012 (List View UI) completed.
- **API**: POST /api/lists/{id}/items

## Granular Instructions
- [ ] Create `src/components/AddItemForm.tsx`:
    - Input field for item title.
    - Submit button.
    - Loading state during API call.
- [ ] Create `src/hooks/useAddItem.ts`:
    - Handle API call to add item.
    - Return loading/error state.
- [ ] Integrate into `ListPage.tsx`:
    - Show form above/below item list.
    - Refresh list after adding.
- [ ] Add keyboard shortcut (Enter to submit).
- [ ] Style consistently with app theme.
- [ ] Add tests.

## Definition of Done
- [ ] Can add new item via form.
- [ ] List refreshes after adding.
- [ ] Automated Tests passing.
- [ ] `status.md` updated.
- [ ] Next Task created.
