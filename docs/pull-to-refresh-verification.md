# Pull-to-refresh verification

Worktree: `/home/martin/repos/TogetherList-pull-to-refresh`. No commits, pushes, PRs, merges, backend edits, or dependency/lockfile changes. Task completion, requirement acceptance, and status updates remain pending explicit user acceptance per the workflow skill.

## Behavior

The displayed list accepts a single-finger downward touch on non-interactive surfaces at page/ancestor scroll top. A release at 72 CSS pixels refreshes, including on empty/short lists. Small, horizontal, upward, reversed, canceled, scrolled, multi-touch, and control-origin gestures do not activate. Eligible positive downward moves prevent default scrolling from the first cancelable move, including within the 10-pixel visual slop; feedback stays hidden within that slop. Horizontal, upward, stationary, interactive, and scrolled gestures retain their default behavior. Pull/release hints exist in all 21 supported locales; loading/failure messages reuse existing translations.

Manual refresh and polling reuse guarded replay-before-fetch sync. The existing offline loader still projects pending edits and returns cached state on network failure. A refresh error retains the displayed list and releases the guard for retry. The page's native overscroll refresh is suppressed while the gesture wrapper is mounted, then restored on cleanup. No browser reload is introduced.

## Strict TDD evidence

Each failing assertion was executed and observed before its corresponding fix:

1. `bun run test:run src/test/ListPage.pull-to-refresh.test.tsx`: RED, `expected "vi.fn()" to be called 2 times, but got 1 times`. The existing empty-list page ignored a downward pull. After gesture/sync integration: GREEN, 1 test.
2. `bun run test:run src/test/pull-to-refresh.test.tsx`: RED, reversal assertion expected no refresh but received 1 call (10 other boundary/lifecycle checks passed). After resetting distance when the finger returns near its origin: GREEN, 12 tests across both files.
3. `bun run test:run src/test/ListPage.pull-to-refresh.test.tsx`: RED, polling overlap expected replay once but received 2 calls. After coalescing the complete sync promise: GREEN, 13 tests across both files.
4. `bun run test:run src/test/pull-to-refresh.test.tsx`: RED, an idle status region remained in the document. After removing its status role while idle: GREEN.

Additional coverage verifies fetch/replay failures and retry with retained content, prevention boundaries, nested scrolling and input controls, cleanup after unmount, and restoration of native overscroll. Failure tests use fake timers to avoid real polling consuming their one-shot failure mocks under CPU contention. Mocks are fully reset between tests.

## Independent review fixes (2026-10-07)

Scope limited to the two review findings, regression tests, and this evidence. Commands below used `/tmp/togetherlist-bun/bun-linux-x64/bun` directly in `frontend/`.

1. Polling error classification: `bun run test:run src/test/ListPage.pull-to-refresh.test.tsx` was executed before the production fix and failed: the fetch-error case expected zero storage-error events but received one (5 other tests passed). Storage feedback now originates from the replay rejection handler, while propagated fetch errors remain available to manual-refresh feedback and polling consumes them without emitting a storage-error event. The same command then passed all 6 tests. Coverage mounts `OfflineStatus`, verifies genuine replay/storage feedback, and verifies that a failed fetch followed by successful polling does not latch a storage warning.
2. Touch termination and outside fingers: `bun run test:run src/test/pull-to-refresh.test.tsx` was executed before the production fix and failed all 4 new cases: remaining touches, a different ending identifier, and a second finger starting outside the wrapper with either release order. Each unexpectedly refreshed once (14 existing tests passed). The handler now checks remaining and changed touches, and a document capture listener cancels an active multi-touch gesture even when the extra finger starts outside the wrapper. That listener is removed on cleanup. Existing successful-release fixtures now include the actual ending touch identifier. Both focused files then passed: 24 tests. Each canceled gesture also verifies that a fresh valid gesture can refresh.

The full unit suite, build, and lint were rerun after both fixes and passed without warnings; results below reflect this rerun. `git diff --check` also passed. Existing browser-suite limitations remain unchanged; browser suites were not rerun for this scoped review fix. No commits, pushes, or PRs were created.

## First-move cancellation review fix (2026-10-07)

Scope: latest review finding only, in `pull-to-refresh.tsx`, its unit test, and this evidence. No other existing worktree changes were edited.

- RED: `bun run test:run src/test/pull-to-refresh.test.tsx` ran before the handler change: 2 failed, 23 passed. The new small-first-move/full-pull regression expected cancellation at 1 pixel but received an uncanceled event. The existing pending-refresh test's updated 5-pixel assertion failed for the same reason.
- GREEN: the same command passed all 25 tests after moving cancellation ahead of the visual-slop return. Positive downward movement must dominate horizontal movement; small horizontal gestures are rejected before cancellation. Zero movement remains unprevented. The regression checks 1-pixel and 10-pixel cancellation without feedback, then a full 72-pixel pull with feedback and exactly one refresh. Six additional cases preserve stationary, small horizontal, upward, interactive, scrolled, and noncancelable first moves.
- Full rerun: `bun run test:run` passed 12 files / 117 tests; `bun run build` passed TypeScript and production compilation (JavaScript gzip 147.40 kB, CSS gzip 6.69 kB); `bun run lint` passed without errors or warnings. Commands ran in `frontend/` with `PATH=/tmp/togetherlist-bun/bun-linux-x64:$PATH`.
- Browser verification was unavailable and browser suites were not run for this fix. jsdom verifies default prevention and the subsequent full pull, but cannot demonstrate that a real touch browser keeps later events cancelable or suppresses native scrolling. The previously recorded browser blockers below are historical evidence, not new verification.
- `git diff --check` passed. No commit or push. Task completion, requirement lifecycle, and `status.md` remain unchanged pending explicit acceptance.

## Final checks

Commands executed in `frontend/` with `PATH=/tmp/togetherlist-bun/bun-linux-x64:$PATH` (Bun 1.4.2):

| Command | Result |
| --- | --- |
| `bun install --frozen-lockfile` | Dependencies installed; lockfile unchanged. Configured audit scanner encountered an existing response-format incompatibility. |
| `bun run test:run` | PASS (latest first-move fix rerun): 12 files, 117 tests, including the existing offline regressions and 31 gesture/list checks. |
| `bun run build` | PASS: TypeScript check and production build. JavaScript gzip 147.40 kB; CSS gzip 6.69 kB. |
| `bun run lint` | PASS: no errors or warnings. |
| `bun run test:e2e:run` | BLOCKED: global setup cannot spawn `go` (`ENOENT`); browser tests did not run. |
| `bun run test:offline:run` | Build passes; production browser suite BLOCKED by missing `go`; 2 tests skipped. |
| `git diff --check` | PASS. |

Initial typecheck findings (possibly undefined touches/mock invocation entries) and an unused test import were fixed before final checks.

## Limitations and review

- Browser and physical-device verification are pending. jsdom cannot verify real touch dispatch, compositor scrolling, or native browser refresh suppression. Chrome/ChromeDriver also are not available on this environment's PATH.
- Network failures with a cached snapshot intentionally use the existing offline loader's fallback/global offline feedback; gesture failure feedback is shown for propagated fetch/sync errors.
- New locale wording has not had native-speaker review.
- The configured npm audit scanner reported `Invalid input: expected record, received undefined` at `advisories`; installation succeeded, but this is not a clean dependency audit result. No dependency or scanner changes are included.
- No new ADR: this feature follows the existing sync/offline design. REQ-0024 remains Proposed; `status.md` was deliberately left unchanged under the workflow's explicit acceptance rule.

## Exact changed files

- `docs/pull-to-refresh-verification.md`
- `docs/requirements/0024_pull-to-refresh.md`
- `docs/tasks/0028_pull-to-refresh.md`
- `docs/tasks/0029_review-pull-to-refresh.md`
- `frontend/public/locales/ar/translation.json`
- `frontend/public/locales/bn/translation.json`
- `frontend/public/locales/cs/translation.json`
- `frontend/public/locales/de/translation.json`
- `frontend/public/locales/el/translation.json`
- `frontend/public/locales/en/translation.json`
- `frontend/public/locales/es/translation.json`
- `frontend/public/locales/fr/translation.json`
- `frontend/public/locales/hi/translation.json`
- `frontend/public/locales/hu/translation.json`
- `frontend/public/locales/id/translation.json`
- `frontend/public/locales/it/translation.json`
- `frontend/public/locales/ja/translation.json`
- `frontend/public/locales/nl/translation.json`
- `frontend/public/locales/pl/translation.json`
- `frontend/public/locales/pt/translation.json`
- `frontend/public/locales/ru/translation.json`
- `frontend/public/locales/sv/translation.json`
- `frontend/public/locales/tr/translation.json`
- `frontend/public/locales/uk/translation.json`
- `frontend/public/locales/vi/translation.json`
- `frontend/src/features/view-list/ListPage.tsx`
- `frontend/src/features/view-list/pull-to-refresh.tsx`
- `frontend/src/test/ListPage.pull-to-refresh.test.tsx`
- `frontend/src/test/pull-to-refresh.test.tsx`
