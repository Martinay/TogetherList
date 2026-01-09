# Decide State Synchronization Strategy

## Goal
Create an ADR that defines how real-time updates are synchronized between clients.

## Scope
- **Directory**: `docs/adr/`
- **Files**: `docs/adr/0005_state_sync_strategy.md`

## Context
- **Current assumption**: Polling-based sync (from vision.md).
- **Need to formalize**: Polling interval, conflict handling, optimistic updates.

## Granular Instructions
- [ ] Research sync strategies:
    - Simple polling (current plan)
    - Long polling
    - Server-Sent Events (SSE)
    - WebSockets
- [ ] Define polling parameters:
    - Default interval (e.g., 3s, 5s?)
    - Backoff strategy when idle
    - Visibility API integration (pause when tab hidden)
- [ ] Define conflict resolution:
    - Last-write-wins?
    - Event ordering guarantees
    - How to handle stale reads
- [ ] Define optimistic update strategy:
    - Update UI immediately?
    - Rollback on conflict?
- [ ] Draft ADR at `docs/adr/0005_state_sync_strategy.md`.

## Definition of Done
- [ ] ADR created with clear decision and rationale.
- [ ] `status.md` updated with new Key Decision.
- [ ] Next Task created if needed.
