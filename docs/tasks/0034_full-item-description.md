# 0034: Two-line collapsed description correction

Status: implemented; user review pending. No task completion or requirement status transition is implied.

Scope: `frontend/src/features/view-list/ListItem.tsx`, description browser regressions, REQ-0016, coverage inventory and this handoff. No backend changes.

User correction supersedes the previous full collapsed preview proposal: collapsed descriptions show at most two lines with a native ellipsis (…) only on overflow. Short text remains natural height; line breaks and long-word wrapping are preserved. Expanded descriptions retain PR130 full-height textarea autosizing on opening, editing and viewport resize, including completed disabled items. The production fix adds only Tailwind `line-clamp-2` to the collapsed span.

Test-first: the replacement browser regression failed before the production change (computed clamp `none` rather than `2`; 2 other tests passed). It covers one line, exactly two lines, overflowing multiline and unbroken text, desktop/mobile, completion and reload through the real Go/JSONL stack. The expanded autosizing regression remains unchanged. REQ-0016 preview wording is reconciled with the explicit user correction; its status remains Proposed. No ADR is needed for this local presentation fix.

Next step: user review of this correction and verification below; no further implementation task is proposed.

## Verification

Environment: sourced `/tmp/full-description-env.sh`; Bun 1.4.3. Temporary logs and copied JUnit reports use `$TMPDIR/two-line-*`; normal ignored E2E harness artifacts remain in `frontend/e2e-artifacts/`.

Commands from `frontend/`:

- `bun install --frozen-lockfile`: success, 551 packages installed; configured npm scanner returned its pre-existing invalid `advisories` response parsing error. Security auditing remains unverified; no dependency or lockfile changes.
- `bun run test:e2e:run -- src/test/e2e/item-description.e2e.test.ts`: before fix **2 passed / 1 failed**, 11.69s; after fix **3/3 passed**, 21.73s. Logs: `two-line-red.log`, `two-line-green.log`.
- `bun run test:run`: **131/131 tests, 14 files**, 9.77s; `two-line-unit.log`.
- `bun run lint`: passed; `two-line-lint.log`.
- `bun run build`: passed, includes TypeScript; production JS 150.70 kB gzip, CSS 7.38 kB gzip; `two-line-build.log`.
- Exploratory `bun run test:e2e:run`: **75 passed / 1 failed**, 184.75s. The production build was mistakenly run concurrently and replaced served E2E assets; the privacy no-analytics assertion detected the enabled SDK. This run is superseded by two isolated runs, with no weakened assertions. Log/report: `two-line-e2e-1.{log,xml}`.
- First isolated `bun run test:e2e:run`: **76/76 tests, 14 files, zero failures/skips**, 179.77s; `two-line-e2e-2.{log,xml}`.
- Repeat isolated `bun run test:e2e:run`: **76/76 tests, 14 files, zero failures/skips**, 179.07s; `two-line-e2e-3.{log,xml}`. Both isolated runs use identical final production/test source.

From `backend/`: `go test ./...` passed **11 packages**; `go vet ./...` passed. No backend source changes; logs `two-line-go-{test,vet}.log`.

From repository root: `python3 scripts/test_e2e_policy.py` passed **5 tests**; `python3 scripts/check-e2e-policy.py --report "$TMPDIR/two-line-e2e-2.xml"` passed **76 executed, zero skips/failures, 14 inventoried specs**. The same policy command passed for `two-line-e2e-3.xml` (**76 executed, zero skips/failures**). `git diff --check` passed.

No commit, push, PR, merge or deployment. Existing requirement statuses and status kanban remain unchanged pending user acceptance.
