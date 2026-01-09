# Implement Item API Endpoints

## Goal
Create REST API endpoints for item management (add, edit, assign, complete).

## Scope
- **Directory**: `backend/`
- **Files**: `backend/internal/api/**`

## Context
- **Prerequisite**: Task 0008 (List API) completed.
- **Endpoints needed**: POST /api/lists/{id}/items, PATCH /api/lists/{id}/items/{item_id}

## Granular Instructions
- [ ] Implement `POST /api/lists/{id}/items`:
    - Validate list exists.
    - Generate item UUID.
    - Append `ItemAdded` event.
- [ ] Implement `PATCH /api/lists/{id}/items/{item_id}`:
    - Support updating: title, assigned_to, is_completed.
    - Append appropriate event (`ItemTitleEdited`, `ItemAssigned`, `ItemCompleted`).
- [ ] Add request validation.
- [ ] Add integration tests.

## Definition of Done
- [ ] Can add items to a list via API.
- [ ] Can update item properties via API.
- [ ] Automated Tests passing.
- [ ] `status.md` updated.
- [ ] Next Task created.
