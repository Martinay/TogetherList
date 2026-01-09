# Implement CORS and Frontend-Backend Integration

## Goal
Enable communication between frontend and backend with proper CORS configuration.

## Scope
- **Directory**: `backend/`, `frontend/`
- **Files**: `backend/internal/api/**`, `frontend/src/**`

## Context
- **Setup**: Frontend on :5173, Backend on :8080.
- **Prerequisite**: Backend API and Frontend UI tasks completed.

## Granular Instructions
- [ ] Add CORS middleware to backend:
    - Allow origin from frontend dev server.
    - Allow required methods (GET, POST, PATCH, OPTIONS).
    - Allow Content-Type header.
- [ ] Configure frontend API client:
    - Create `src/api/client.ts` with base URL.
    - Environment variable for API URL.
- [ ] Update all API calls to use client.
- [ ] Test full flow:
    - Create list from landing page.
    - Add items from list page.
    - Verify persistence.
- [ ] Add integration tests.

## Definition of Done
- [ ] Frontend can communicate with backend.
- [ ] Full user flow works end-to-end.
- [ ] Automated Tests passing.
- [ ] `status.md` updated.
- [ ] Next Task created.
