# Implement List API Endpoints

## Goal
Create REST API endpoints for list creation and retrieval.

## Scope
- **Directory**: `backend/`
- **Files**: `backend/internal/api/**`, `backend/cmd/server/main.go`

## Context
- **Prerequisite**: Task 0007 (Event Sourcing Core) completed.
- **Endpoints needed**: POST /api/lists, GET /api/lists/{id}

## Granular Instructions
- [x] Create `internal/api/handlers.go` with handler functions.
- [x] Implement `POST /api/lists`:
    - Generate UUID for new list.
    - Append `ListCreated` event.
    - Return list ID.
- [ ] Implement `GET /api/lists/{id}`:
    - Read events, reconstruct state.
    - Return current list state as JSON.
- [ ] Wire up routes in `main.go`.
- [ ] Add integration tests for API endpoints.

## Definition of Done
- [ ] Can create a new list via API.
- [ ] Can retrieve list state via API.
- [ ] Automated Tests passing.
- [ ] `status.md` updated.
- [ ] Next Task created.
