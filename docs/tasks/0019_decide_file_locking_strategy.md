# Decide File Locking Strategy

## Goal
Create an ADR that defines how concurrent writes to JSONL event files are handled.

## Scope
- **Directory**: `docs/adr/`
- **Files**: `docs/adr/0006_file_locking_strategy.md`

## Context
- **Architecture**: Event sourcing with JSONL files (one per list).
- **Problem**: Multiple users may append events simultaneously.
- **ADR 0003 mentions**: File locking (`flock`) but needs detailed design.

## Granular Instructions
- [ ] Research file locking options in Go:
    - `flock` (advisory locks, Unix)
    - `sync.Mutex` (in-memory, per-list)
    - File rename/atomic write patterns
    - External lock services (overkill?)
- [ ] Evaluate trade-offs:
    - Performance under concurrent load
    - Cross-platform compatibility
    - Simplicity of implementation
- [ ] Define the locking protocol:
    - When to acquire/release locks
    - Lock granularity (per-file, per-list)
    - Timeout and retry behavior
- [ ] Draft ADR at `docs/adr/0006_file_locking_strategy.md`.

## Definition of Done
- [ ] ADR created with clear decision and rationale.
- [ ] `status.md` updated with new Key Decision.
- [ ] Next Task created if needed.
