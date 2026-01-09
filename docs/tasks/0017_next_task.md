# Decide Storage Implementation

## Goal
Decide the specific storage implementation for the JSONL event logs, now that Azure Container Apps is chosen.

## Context
- **Deployment**: Azure Container Apps (ADR 0004)
- **Constraint**: Must be persistent (survive container restarts).
- **Options**:
    - **Azure Files Volume Mount**: Posix-compliant, simple `os.Open()`, works with `flock`.
    - **Azure Blob Storage**: Object storage API, potentially cheaper, requires SDK and concurrency handling (ETags/Leases instead of `flock`).

## Instructions
- [ ] Evaluate Azure Files vs Azure Blob Storage for:
    - Cost (Transaction costs on Blob vs capacity on Files)
    - Concurrency Safety (File locking support)
    - Developer Experience (Local dev parity)
- [ ] Draft ADR at `docs/adr/00xx_storage_implementation.md`
