# Implement Backend Core

## Goal
Initialize the Go backend and set up the HTTP server structure.

## Scope
- **Directory**: `backend/`
- **Files**: `backend/**/*`

## Context
- **Tech Stack**: Go + net/http (from ADR 0003).

## Granular Instructions
- [ ] Initialize Go module `backend`.
- [ ] Create `cmd/server/main.go`.
- [ ] Implement basic HTTP server listening on port 8080.
- [ ] Create `internal/events/` package (placeholder for event sourcing).

## Definition of Done
- [ ] Server starts and listens.
- [ ] `/health` endpoint returns 200 OK.
- [ ] Automated Test for Health Handler.
- [ ] `status.md` updated.
- [ ] Next Task created.
