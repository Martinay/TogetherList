# 0030: Comprehensive production E2E coverage

## Status

Pending user review. Implementation, inventory and CI enforcement are in [PR #117](https://github.com/Martinay/TogetherList/pull/117); exact final verification is recorded there. Do not mark accepted/complete without user confirmation.

## Scope

This worktree only, branch `test/comprehensive-e2e`: frontend E2E specs/harness/configuration, CI workflows, coverage inventory, contributor/agent/PR policy and structural guardrails. Production changes only for test-first reproduced bugs. Exclude generated coverage files. Existing offline/Go feature work is inspected as current behavior rather than reimplemented.

## Steps

1. Inventory implemented routes and actions against browser tests.
2. Run a production frontend + Go + isolated JSONL store with pinned Chrome/Driver.
3. Fill validation, persistence/restart, identity/sharing/collaboration, offline and recent-feature gaps.
4. Require same-change E2E coverage and maintain inventory; document what automation cannot prove.
5. Execute full E2E twice and existing quality checks, review diff, commit/push and open PR.
6. Monitor PR CI and diagnose failures without weakening or skipping tests. Report remaining device/manual gaps honestly.

## Handoff

See [coverage inventory](../e2e-coverage.md) and final PR for exact verification. Follow-up: reviewer acceptance and real Android/iOS gesture/native-share verification described in task 0029. Do not merge or change branch protection.
