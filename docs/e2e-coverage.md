# Feature-to-test coverage inventory

Scope: current source on `test/comprehensive-e2e`. This inventory maps implemented behavior rather than the older status kanban. Tests use the built React application served by a real Go process and isolated temporary JSONL event storage; there is no SQL database or account authentication in this product. Sharing a URL grants access and each device chooses a participant display name. Authentication/authorization tests are therefore not applicable. No login, logout, delete item/list, participant editing after creation, or unknown-route recovery UI exists.

## Browser features and initial gaps

Spec paths below are relative to `frontend/src/test/e2e/`. Every named scenario is executable, not a claim of universal input/platform coverage.

| Feature / route / action | Prior coverage | Current E2E spec and scenarios |
| --- | --- | --- |
| Landing `/`, FAQ and creation navigation | Existing landing section/FAQ tests | `landing-page.e2e.test.ts`: headline, CTA, How It Works, six features, use cases, comparison, eight FAQs and FAQ expansion; `user-journeys.e2e.test.ts`: “validates wizard fields…” opens FAQ and navigates into creation; saved-list links in “persists and switches per-list identity…” |
| Wizard `/list/new`: list/creator names, participants, duplicates, removal, back, Enter, creator identity, empty state | Happy creation as fixture only | `user-journeys.e2e.test.ts`: “validates wizard fields, duplicate participants, removal and back navigation before creating”; rejects blank/whitespace and duplicate names, trims list name, persists real participants |
| Creation failure and offline restriction | None | `offline-recovery.e2e.test.ts`: “shows a real transport failure during creation…” retries after browser-level network blocking; “opens saved lists and refuses new-list creation…” |
| Shared deep link `/list/:id`, participant selection, switching, per-list identity isolation and reload | Mocked identity unit tests | `user-journeys.e2e.test.ts`: “persists and switches per-list identity and reopens saved lists from home”; invalid/missing shared-list load errors |
| Share, clipboard and separate participants collaborating | None | `user-journeys.e2e.test.ts`: “copies the real shared URL and synchronizes independent participant sessions both ways”; actual clipboard read, no storage shared across sessions, add/complete polling and creator/completer audit fields |
| Add items and empty/whitespace input | Happy add as fixture only | `user-journeys.e2e.test.ts`: “edits titles, cancels and rejects blanks…”; validates blank Add and real server state |
| Item title save/trim/Unicode, Escape cancellation and blank cancellation | None | `user-journeys.e2e.test.ts`: “edits titles, cancels and rejects blanks, assigns multiple people and clears assignments” |
| Item expand/collapse, description add/edit/preview/clear/reload | Existing | `item-description.e2e.test.ts`: “allows adding, editing, and previewing item description”; `offline.production.test.ts` verifies replayed description; persistence spec verifies restart |
| Multi-participant assignment, clear, collapsed preview, persistence, completed-item restrictions | Mocked unit tests | `user-journeys.e2e.test.ts`: “edits titles…” verifies multi-assign and clear against HTTP state, reload preview, disabled assignment/description and absent title editing after completion |
| Complete/uncomplete, strikethrough and audit fields | Existing | `item-completion.e2e.test.ts`: “marks an item as completed via checkbox”, “uncompletes a completed item”; independent-session completer in user journeys; MCP complete/uncomplete |
| List rename incl Unicode | Existing | `rename-list.e2e.test.ts`: initial title, standard rename, emoji/special characters; `user-journeys.e2e.test.ts`: “cancels list rename and prevents empty names…”; offline and restart specs |
| Active sort modes, stored choice, completed section | Existing partial | `uncompleted-sorting.e2e.test.ts`: “supports uncompleted sorting modes, persists after reload, and keeps completed section behavior”; newest/A–Z/Z–A and completed timestamp ordering. Oldest-first added in this change. |
| Language detection and manual switching, persistence, Arabic RTL/LTR | Existing | `language-support.e2e.test.ts`: unsupported fallback, stored manual selection, RTL switching and each of 21 supported browser languages |
| Mobile core actions | None | `user-journeys.e2e.test.ts`: “keeps core actions usable at a mobile viewport” at 390×844; asserts no horizontal overflow |
| Pull-to-refresh | Mocked gesture/unit tests only | `pull-to-refresh.e2e.test.ts`: “refreshes real shared state with a touch gesture…” and “ignores short pulls and input gestures and shows failure then recovers…” use Chrome DevTools touch input with real requests |
| Production service worker, cached shell and saved lists offline | Separate suite, not in CI | `offline.production.test.ts`: “reloads the production shell and durable edits offline, then automatically replays exactly once”; all six mutation types + reload + exactly one backend item. `offline-recovery.e2e.test.ts`: saved-list home navigation offline |
| Cross-tab queue durability and replay owner | Separate suite, not in CI | `offline.production.test.ts`: “keeps cross-tab edits durable during a delayed acknowledgement and coalesces replay”; delayed real request, two tabs, queue preserved, no duplicate replay |
| Offline field conflict, review local/shared values, retry/discard | Mocked unit tests only | `offline-recovery.e2e.test.ts`: genuine remote rename while browser offline, HTTP 409 review, explicit overwrite retry, discard confirmation/cancellation retaining shared value |
| Durable storage failure | Mocked unit tests only | `offline-recovery.e2e.test.ts`: “rejects unsafe edits when durable local storage is unavailable”; injected browser storage quota failure verifies input retained and backend unchanged |
| JSONL reconstruction across process restart | Backend unit tests only | `persistence.e2e.test.ts`: “reconstructs all list and item fields from JSONL after restarting the Go process”; real termination/restart, identical HTTP state, fresh uncached browser |

## HTTP routes and integrations

`api-contract.e2e.test.ts` checks real HTTP validation, retry deduplication, stale revisions, unchanged state on rejection, deep links and production assets. `mcp.e2e.test.ts` executes every tool via JSON-RPC HTTP and reads the same state in the browser, plus protocol/tool failures and SSE establishment.

| Server route | Coverage |
| --- | --- |
| `GET /health` | Harness startup readiness; production server must respond |
| `POST /api/v1/list/create` | Browser wizard; malformed JSON, required fields, duplicates, GET UUID validation, idempotent retry/conflict |
| `GET /api/v1/list/{id}` | Browser load/poll/reload; invalid UUID and absent-list empty projection (established API contract); browser missing-list error; restart reconstruction |
| `PUT /api/v1/list/{id}/name` | Browser rename/cancel/blank validation; stale revision rejection; offline conflict/retry/discard |
| `POST /api/v1/list/{id}/items` | Browser add/blank validation; idempotent replay; invalid idempotency key |
| `PUT /api/v1/list/{id}/items/{itemId}/title` | Browser edit/cancel/blank; real API blank rejection and offline replay |
| `PUT /api/v1/list/{id}/items/{itemId}/description` | Browser description save/edit/preview; offline replay; restart |
| `PUT /api/v1/list/{id}/items/{itemId}/completed` | Browser complete/uncomplete; collaboration/audit; invalid item UUID; offline replay |
| `PUT /api/v1/list/{id}/items/{itemId}/assigned-to` | Browser multi-assign/clear/disabled; HTTP unknown participant and missing item rejection |
| `POST /api/v1/mcp`, `POST /mcp` | initialize, tools/list and every tool: `list_lists`, `get_list`, `create_list`, `rename_list`, `add_item`, `complete_item`, `assign_item`, `update_item_title`, `update_item_description`; resource read; invalid/missing lists, unknown method and malformed JSON |
| `GET /api/v1/mcp/sse`, `GET /mcp/sse` | Real streaming session and tools/list JSON-RPC message roundtrip through the advertised endpoint |
| `POST /api/v1/mcp/messages`, `POST /mcp/messages` | Successful delivery through the advertised canonical endpoint, and missing-session rejection on both aliases |
| `/api/` (unknown API fallback) | Unknown API path returns 404 without serving SPA HTML; test-first routing regression |
| `/` (SPA/static/crawler handler) | Real deep-link HTML, assets/translations/worker/LLM documents, crawler response; backend unit tests supply traversal/bot-selection edge cases |

## Running and diagnosing

Prerequisites: Go 1.27.1, Bun 1.4.2, Linux Chrome and matching ChromeDriver, browser system libraries, fonts and a C compiler for backend race tests. `bash scripts/install-e2e-browser.sh "$PWD/.cache/e2e-browser"` installs checksummed Chrome/Driver 149.0.7827.155. Export `CHROME_BINARY` and `CHROMEDRIVER_BINARY` to those binaries (or put matching binaries on PATH). CI installs Linux prerequisites explicitly. Ports 5173, 19517 and 18089 must be free; harness refuses to reuse unknown services.

From `frontend/`: `bun install --frozen-lockfile`, `bun run test:e2e:run`. This builds production then runs only E2E files, including the offline production suite. Repeat the same command for flake detection. `bun run test:offline:run` filters that one production spec through the same harness. A bounded diagnostic example is `bun run test:e2e:run -- src/test/e2e/user-journeys.e2e.test.ts -t 'cancels list rename'`; filtered runs are not full verification and must not be submitted as a zero-skip CI result.

From root: `python3 scripts/check-e2e-policy.py`; after a complete run, `python3 scripts/check-e2e-policy.py --report frontend/e2e-artifacts/results.xml`. Quality checks: `.agent/skills/backend/scripts/check.sh` (build, race tests, vet, staticcheck, gosec), and from `frontend/`, `bun run lint`, `bun run tsc --noEmit`, `bun run test:run -- --coverage`, `bun pm scan`.

The harness owns services and starts with new temporary JSONL storage. Specs run sequentially with fresh browser profiles where needed; unique list IDs prevent fixture collisions. Two legacy completion/rename cases retain their documented sequential scenario dependency. Failure evidence in `frontend/e2e-artifacts/`: JUnit XML, server/driver logs, temporary JSONL stores, failure screenshots/DOM/browser console and end-of-session snapshots. CI retains both full runs for 14 days, fails on missing artifacts/zero executed tests/skips, and gates main deployment on E2E.

## Enforcement and limits

[Contributor rules](../CONTRIBUTING.md), [agent rules](../AGENTS.md), and [PR checklist](../.github/pull_request_template.md) require same-change E2E coverage and inventory review. `scripts/check-e2e-policy.py` rejects focused/skipped/conditional E2E declarations, uninventoried specs/routes, and production PRs without an inventory update. Completed reports must have tests and zero skips/failures. It cannot determine whether assertions fully exercise arbitrary new behavior; that remains mandatory reviewer judgment. Refactors can document why existing coverage suffices; new behavior requires scenarios and assertions.

Browser runs block external Google Fonts requests to keep the local integration reproducible; typography delivery is not verified. Known platform limits: Linux desktop Chrome and a mobile-sized Chrome viewport only. Native OS share sheets, actual Android/iOS gesture behavior, Safari/Firefox, performance budgets, accessibility audits and all 21 languages' translation semantics need separate device/manual or specialized validation. Network and quota faults use browser controls, and the delayed-acknowledgement case wraps browser fetch while forwarding to the real server. Unit tests cover detailed queue rebase/error variations and gesture rejection combinations; these do not imply exhaustive end-to-end coverage of every storage failure/status or interleaving. SSE endpoint establishment and JSON-RPC roundtrips are covered. No claim of mechanically provable feature completeness is made.

## Verification record

The corrected full local suite executed **66 tests in 13 files**, all passing with zero skips (135.66 seconds); the saved JUnit report passed `python3 scripts/check-e2e-policy.py --report frontend/e2e-artifacts/results.xml`. The suite has 24 more scenarios than the previous 42 tests including the separate offline suite (40 in the old default suite).

`bun run test:run -- --coverage` passed all 117 unit tests. Backend build/race tests/vet/staticcheck/gosec passed after the production fixes (11 packages; zero gosec issues). Frontend lint/type-check and all five policy tests passed (including root-level frontend source change enforcement). The existing `bun pm scan` prints an internal error despite returning zero, and independent `bun audit` reports 102 dependency advisories; security cleanliness is not claimed.

The first exploratory full run failed 6 of 66 tests. Diagnosis reproduced timestamp precision loss and API-to-SPA fallback bugs before minimal production fixes; existing absent-list HTTP 200 and omitted empty optional fields were verified against the established backend contract rather than changed. Driver input, network emulation, animation timing and SSE chunk boundaries were corrected without dropping assertions.

[PR #117](https://github.com/Martinay/TogetherList/pull/117) records the final repeat-run and GitHub Actions results, exact commands and remaining platform/security limits. Test completeness still requires reviewer judgment; the inventory is not a proof of universal coverage.

## Clarity consent and privacy (feature/clarity-analytics)

| Feature / route / action | Exact test coverage |
| --- | --- |
| Consent/footer on all routes; `/privacy`; reload persistence and revocation | `privacy.e2e.test.ts`: “persists opt-in, decline and revocation and exposes the complete privacy statement from landing” verifies explicit root masking and no-referrer policy, no SDK before consent or in test builds, persisted decline/accept/revoke, required policy data types/purpose and Microsoft link |
| Application privacy access, identity, real JSONL-backed items and offline policy | `privacy.e2e.test.ts`: “keeps private shared lists functional with consent and privacy reachable, across reload and offline” seeds a real list, selects participant, adds an item, verifies HTTP projection, privacy navigation and no SDK on private routes; cached offline policy/reload and persisted decline |
| Consent failure and cross-tab change | `privacy.e2e.test.ts`: “fails closed on storage errors and synchronizes choices between tabs without changing list state” injects actual browser storage failure, asserts alert/no SDK/unchanged server state, then verifies decline synchronization between two tabs |

Complementary unit tests: `clarity.test.ts` covers exact project URL, production-only mode, queued consentv2 analytics-granted/ad-denied, idempotent loading, private/query/fragment/referrer/saved-list exclusion, invalid choice and storage failures. `privacy-controls.test.tsx` covers accessible named controls, status and alert, persistent choices and policy. Existing full E2E identity/sharing/collaboration and JSONL reconstruction scenarios remain applicable: no backend mutation behavior changed. Privacy navigation and controls are frontend-local, not additional JSONL events.

Production changes reviewed: App privacy route/footer; masked root/no-referrer document; full landing-to-creation navigation; suppression of saved-list links in recording documents; static crawler disclosure and corrected AI-readable privacy claim; all 21 locale files; test mode build isolation. Existing core routes, saved-list navigation, RTL/language selection and offline shell tests protect against regressions. Each “detects browser language: <language>” scenario in `language-support.e2e.test.ts` now also asserts translated disclosure, accept/decline labels and the privacy route’s translated title and full statement for all 21 languages.

Honest gaps: E2E deliberately builds production assets with `--mode e2e` so no real participant/list information is sent to Microsoft during tests. SDK loading/consent queue and eligibility are unit tested, but real Microsoft network ingestion, dashboard settings, session replay masks, immediate SDK shutdown timing, third-party cookie deletion and production cross-tab recorder termination are not verified against Microsoft's live SDK. Full recording acceptance/revocation is not claimed by the disabled-SDK E2E assertions. Translation semantics across 21 languages and device/screen-reader audits require human review. Analytics deliberately excludes private workflows and many landing visits. No advertising integration is present.

### Local verification — 2026-10-07

- Bun 1.4.2, Go 1.27.1, checksummed Chrome/ChromeDriver 149.0.7827.155. Missing browser libraries were downloaded/extracted into temporary tooling paths; no system or repository dependency pins were changed.
- Initial E2E startup executed no scenarios because ChromeDriver lacked `libnspr4.so`; resolved with the temporary runtime libraries. The first complete exploratory run passed 68/69 scenarios (152.35s): the new assertion indexed the backend's ID-keyed item map as an array. Corrected to `Object.values` and strengthened to assert the single item's title and creator; no production bug or assertions weakened.
- Three subsequent complete `bun run test:e2e:run` runs passed **69/69 tests in 14 files**, zero skips/failures: **144.26s**, **152.44s**, **153.14s**. The latter two include all 21 localized disclosures/policies and explicit root-mask/referrer checks; the last includes final link contrast changes. JUnit policy review passed with **69 executed, zero skips/failures**. Final component/test filename normalization is nonbehavioral; unchanged scenarios cover it and the final build/unit run verifies resolved imports.
- Final `bun run test:run -- --coverage`: **126/126 tests in 14 files**, **9.80s**. Statements 85.42%, branches 78.10%, functions 83.41%, lines 88.60%.
- Final `bun run lint` and `bun run build` passed (build includes TypeScript). Production build: 484 modules; JavaScript 148.50 KB gzip, CSS 6.73 KB gzip. Standalone TypeScript check also passed.
- Structural inventory/report policy passed: 14 inventoried specs. All **5** policy self-tests passed. `git diff --check` passed.
- Backend quality script downloaded dependencies and built, then stopped at race testing: `go: -race requires cgo; enable cgo by setting CGO_ENABLED=1`; no C compiler is available. Separate ordinary `go test ./...` passed **11 packages**, `go vet` and staticcheck passed, gosec reviewed **18 files / 2065 lines with 0 issues**. No backend source was changed.
- `bun install --frozen-lockfile` succeeded, but the configured security scanner emitted its existing invalid-advisories internal error. `bun pm scan` repeats the internal error despite exiting zero and printing “No advisories found”; that is not evidence of security cleanliness. Independent `bun audit` reports **102 vulnerabilities: 45 high, 45 moderate, 12 low**. No dependencies were added or advisories hidden.
- Accessibility review: semantic links/buttons, persistent named choices, live status and storage alerts, wrapping layout and localized Arabic directionality. Calculated new link text contrast is **16.74:1** on the page background; secondary copy **7.30:1**, button text **17.49:1** on white. Existing mobile scenario passes; this does not substitute for a device/screen-reader audit.

No commit, push, deployment, accepted requirement/ADR, completed task or status-kanban change was made. Draft review remains in [task 0031](tasks/0031_clarity-analytics.md).
