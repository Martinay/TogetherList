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

`bun run test:run -- --coverage` passed all 117 unit tests. Backend build/race tests/vet/staticcheck/gosec passed after the production fixes (11 packages; zero gosec issues). Frontend lint/type-check and all four report-policy tests passed. The existing `bun pm scan` prints an internal error despite returning zero, and independent `bun audit` reports 102 dependency advisories; security cleanliness is not claimed.

The first exploratory full run failed 6 of 66 tests. Diagnosis reproduced timestamp precision loss and API-to-SPA fallback bugs before minimal production fixes; existing absent-list HTTP 200 and omitted empty optional fields were verified against the established backend contract rather than changed. Driver input, network emulation, animation timing and SSE chunk boundaries were corrected without dropping assertions.

[PR #117](https://github.com/Martinay/TogetherList/pull/117) records the final repeat-run and GitHub Actions results, exact commands and remaining platform/security limits. Test completeness still requires reviewer judgment; the inventory is not a proof of universal coverage.
