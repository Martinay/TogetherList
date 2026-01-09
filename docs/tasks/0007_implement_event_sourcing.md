# Implement Event Sourcing Core

## Goal
Implement the core event sourcing logic: event definitions, JSONL storage, and state reconstruction.

## Scope
- **Directory**: `backend/`
- **Files**: `backend/internal/events/**`

## Context
- **Tech Stack**: Go + net/http (from ADR 0003).
- **Architecture**: Event Sourcing with JSONL files (from `docs/vision.md`).
- **Prerequisite**: Task 0006 (Backend Core) completed.

## Granular Instructions
- [ ] Define event structs in `internal/events/types.go`:
    - `ListCreated`, `UserJoined`, `ItemAdded`, `ItemCompleted`, `ItemAssigned`, `ItemTitleEdited`
- [ ] Implement `internal/events/store.go`:
    - `AppendEvent(listID, event)` - Append to JSONL file.
    - `ReadEvents(listID)` - Read all events from file.
- [ ] Implement `internal/events/aggregate.go`:
    - `ReconstructListState(events)` - Build current state from events.
- [ ] Add unit tests for event serialization and state reconstruction.

## Definition of Done
- [ ] Events can be written to and read from JSONL files.
- [ ] State can be reconstructed from event sequence.
- [ ] Automated Tests passing.
- [ ] `status.md` updated.
- [ ] Next Task created.
