# 0028: Pull to refresh

## Status

Implementation and unit verification prepared; acceptance pending. No completion or requirement acceptance recorded.

## Scope

`frontend/` and pull-to-refresh documentation in this worktree only. No backend, dependency, commit, push, PR, merge, or other worktree changes.

## Implementation

Single-finger touch gesture on non-interactive list surfaces at scroll top. Reuses guarded replay-before-fetch synchronization and the existing offline loader. Localized feedback, cancellation boundaries, busy protection, error recovery, and retained list content.

## Verification

See [verification evidence](../pull-to-refresh-verification.md), including strict RED/GREEN slices, full frontend checks, and blocked browser suites. [REQ-0024](../requirements/0024_pull-to-refresh.md) is Proposed.

## Next task

[0029: Review pull-to-refresh](0029_review-pull-to-refresh.md). Confirm acceptance before changing task completion or requirement lifecycle. `status.md` remains unchanged because the workflow requires explicit acceptance before updating it.
