# 0036: Refresh completed item grouping

## Scope and handoff

Only this worktree: `frontend/src/features/view-list/ListPage.tsx`, its refresh integration/E2E tests, REQ-0024 and coverage/task documentation. No backend/schema/dependency change, commit, push, PR, merge or deployment.

Implemented pending user review. Do not mark complete or advance requirement lifecycle without explicit acceptance. Macro status remains unchanged under the workflow's explicit-acceptance rule.

## Change

A dedicated memoized manual refresh callback awaits existing replay/fetch synchronization, then clears session-toggled IDs only while still on that list. Polling and edit callbacks retain the original delayed regrouping. Failures propagate without clearing IDs. Offline successful cache projections regroup while preserving queued edits.

No architecture decision is introduced; existing synchronization and rendering are reused.

## Regression evidence

Before the production fix:
- Integration regression: 3 failed / 7 passed (success plus failed-fetch/replay retry each lacked Completed after successful refresh).
- Real production frontend/Go/JSONL E2E: 2 failed / 2 passed. Both new tests timed out waiting for Completed after a successful pull.
- Initial test harness attempts exposed missing dependencies, two strict TypeScript non-null checks and an omitted synthetic changedTouches field; corrected before recording the behavioral RED results.
- Additional route-switch regression passes: a previous list's delayed refresh must not clear the new list's grouping.

## Verification

- Initial complete post-fix E2E run: 77 passed / 1 failed, 14 files, 199.37s. The test incorrectly expected an HTTP failure with an intact cache to reject synchronization; the existing loader resolves with the cached projection. The rejected-refresh scenario now removes the cache before blocking GET, retaining its failure/grouping/retry assertions. Production code did not change.
- Frontend: `bun run test:run -- --coverage`: 136 tests in 14 files passed. Coverage: statements 85.88%, branches 78.94%, functions 84.75%, lines 88.91%. `bun run lint`, `bun run tsc --noEmit` and final production `bun run build` pass (491 modules; JS 150.71 kB gzip, CSS 7.38 kB gzip).
- Backend: `go build ./...`, `go test -json ./...` (147 test/subtest passes, 12 packages), `go vet ./...`, `staticcheck ./...`, `gosec ./...` (22 files, 2371 lines, zero issues) pass. Initial race attempts failed because cgo was disabled / gcc absent; resolved using SHA256-verified official Zig 0.15.2 under /tmp. `CGO_ENABLED=1 CC='/tmp/refresh-tooling/zig-x86_64-linux-0.15.2/zig cc' go test -race -json ./...` passes 147 tests/subtests across 12 packages, zero failures.
- `TMPDIR=/tmp bash scripts/check-observability.sh` passes (Collector checksum/config and actual Go/JSONL pipeline: 3 requests, 3 correlated logs, 7 metric envelopes, privacy and SIGTERM flush).
- Dependency installation `bun install --frozen-lockfile` succeeds; scanner logs its existing invalid-advisories parsing error. `bun pm scan` repeats that error despite exit zero / “No advisories found”; this is not clean audit evidence. `bun audit` exits 1: 86 existing vulnerabilities (37 high, 37 moderate, 12 low). Manifest/lockfile unchanged; dependency fixes remain outside scope.
- Corrected full `bun run test:e2e:run`: 78/78 passed in 14 files, zero skips/failures, 193.58s. Repeat: 78/78 passed, 14 files, zero skips/failures, 188.52s. JUnit copies `/tmp/refresh-e2e-2-results.xml` and `/tmp/refresh-e2e-3-results.xml` both pass `python3 scripts/check-e2e-policy.py --report <report>`.
- `python3 scripts/check-e2e-policy.py` passes (14 inventoried specs); `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s scripts -p test_e2e_policy.py` passes all 5 policy self-tests; `git diff --check` passes.
- Commands use `source /tmp/full-description-env.sh` for Bun 1.4.3 / Go 1.27.1, existing read-only Chrome/ChromeDriver 149.0.7827.155 binaries and browser runtime libraries/fonts. All source edits and test artifacts are in this worktree; temporary tooling/logs are under /tmp. No source in another worktree was modified. Logs are under `/tmp/refresh-*`; ignored browser/server/JSONL artifacts are in `frontend/e2e-artifacts/`.

## Review / next task

Review REQ-0024's drafted grouping criteria and the inventory scenarios, then verify pull behavior on native Android/iOS. User acceptance and physical-device checks are pending; do not create or begin unrelated implementation work.
