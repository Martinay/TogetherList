---
id: REQ-0012
status: Implemented
type: NonFunctional
priority: P1
source: docs/vision.md
created: 2026-01-09
updated: 2026-01-09
links:
  adr: []
  requirements: [REQ-0011]
tags: [storage, jsonl, persistence, events]
---

# REQ-0012: JSONL Event Storage

## Context

Events must be persisted durably to survive server restarts.
The vision specifies JSON Lines (JSONL) format, where each line is a self-contained JSON object representing one event.
One JSONL file per list provides isolation and simplicity.

## Requirement (EARS)

**Pattern:** Ubiquitous

**Statement:**  
The system shall store events in JSON Lines format with one file per list on the server-side file system.

## Rationale

JSONL storage:
- Simple to implement (append-only file operations)
- Human-readable for debugging
- No database dependencies
- Natural partitioning by list (one file per list)

Trade-offs include limited query capabilities and potential performance issues at scale, which are acceptable for the initial implementation.

## Acceptance Criteria

- Given events are generated for a list
- When the events are persisted
- Then they are stored in a file named `<list-uuid>.jsonl` with one JSON object per line

## Verification

- Method: Inspection
- Evidence: File system inspection confirming JSONL format and structure

## Dependencies and Relationships

- Related requirements: REQ-0011 (Event Sourcing)
- Constraining ADRs: ADR-0003 (Backend Tech) if applicable
- Impacted components: Backend event store, file system access

## Notes

File location should be configurable. Consider implementing file locking for concurrent writes.
