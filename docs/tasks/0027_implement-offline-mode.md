# 0027: Implement offline mode

## Status

Implementation in progress; user acceptance pending. Requirements and ADR are Proposed. No task completion or requirement acceptance recorded.

## Scope

`frontend/`, backend changes necessary for idempotent and conflict-safe replay, and relevant docs. Worktree `TogetherList-offline-mode`, branch `feat/offline-mode`. No commits, pushes, deployment, other worktree edits, or Go/dependency pin changes.

## Implementation

- Atomic persistent snapshots/outboxes with optimistic projection and Web Locks.
- Existing-list/item edits and local identity selection; online-only list creation with stable retry UUID.
- Automatic ordered replay, timeouts/backoff, durable deduplication, field/revision conflict checks, visible retained failure details, explicit conflict retry, and confirmed discard with failed-creation dependency cleanup.
- Stored-list homepage links and translated global status.
- Production app-shell manifest and service worker excluding APIs/error responses.

## Verification and handoff

See [offline verification](../offline-mode-verification.md) for commands, evidence, exact changed-file inventory, and limitations. The independent review findings are addressed; 84 unit tests and two production browser tests pass, including delayed replay with concurrent edits in two tabs. Backend tests/build/vet/staticcheck/gosec pass; race execution remains blocked by the missing C compiler. Acceptance remains pending. Review the Proposed [ADR](../adr/0026_durable-offline-sync.md) and REQ-0020 through REQ-0023 before changing their lifecycle states.

## Follow-up

User review/acceptance, then resolve pre-existing dependency audit findings in a separate task without altering the Go-upgrade pins. No deployment or publication is authorized by this task.
