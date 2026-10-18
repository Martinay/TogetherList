# Landing page: shared lists for people and agents

Status: Independently reviewed; PR delivery authorized. Product acceptance remains pending.

## Scope

`frontend/` landing UI, translations, metadata, generated discovery documents and production tests; `backend/cmd/server/botrender*` cache variation regression; `docs/tasks/`, `docs/requirements/` proposed landing requirement and `docs/e2e-coverage.md`. Work only in `feat/landing-agentic-seo`. Follow-up user authorization explicitly requests commit, push and a non-draft PR to main; no merge or auto-merge.

## Direction

Keep no-signup shared lists primary. Show a realistic meal-plan/grocery-list agent-to-human handoff. Explain the exact eight MCP tools, known-ID resource, legacy HTTP/SSE connection and direct POST JSON-RPC limitations. Warn that holding a link/ID grants read and write access, display names are not authentication, and there is no global enumeration.

Generate crawler HTML, FAQ JSON-LD and LLM context documents from the English translation source and shared metadata. React uses the same schema builder and translated visible answers. Keep all 21 supported locales; revised factual FAQ and sync/free descriptions use English where translations need review. Remove competitor comparisons and search-shaped questions. Use local favicon/social artwork. Restrict robots/sitemap to public discovery; generic list shell carries noindex and no landing schema/social metadata. Root variants vary by User-Agent.

## Verification

See the landing update entry in [the E2E inventory](../e2e-coverage.md) for scenarios, exact results and environment limits. Existing MCP tests exercise every tool, SSE advertised session URLs, browser state and failure/no-enumeration behavior; no MCP server capabilities change.

## Review / next task

Parent review should inspect desktop/mobile and RTL layout, validate copy and run environment-blocked checks before acceptance. Proposed requirement [REQ-0027](../requirements/0027_public-landing-answers.md) awaits explicit acceptance. Do not mark this task complete or alter macro status without user confirmation.

## Exact changed-file manifest

- `backend/cmd/server/botrender.go`
- `backend/cmd/server/botrender_test.go`
- `docs/e2e-coverage.md`
- `docs/requirements/0027_public-landing-answers.md`
- `docs/tasks/0033_landing-agentic-seo.md`
- `frontend/index.html`
- `frontend/package.json`
- `frontend/public/favicon.svg`
- `frontend/public/landing.html`
- `frontend/public/llms-full.txt`
- `frontend/public/llms.txt`
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
- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`
- `frontend/public/social-card.png`
- `frontend/public/social-card.svg`
- `frontend/scripts/generate-landing.ts`
- `frontend/src/features/create-list/LandingPage.tsx`
- `frontend/src/features/create-list/landing-metadata.ts`
- `frontend/src/test/LandingPage.test.tsx`
- `frontend/src/test/e2e/landing-page.e2e.test.ts`
- `frontend/src/test/e2e/mcp.e2e.test.ts`

## Quality evidence

Toolchain: Go 1.27.1, Bun 1.4.3, pinned Chrome/ChromeDriver 149.0.7827.155. Browser archives were checksum-verified; missing browser libraries, fonts and GSettings schemas were extracted inside ignored `.cache/` (no system install). Local E2E requires `LD_LIBRARY_PATH`, `FONTCONFIG_FILE`, `GSETTINGS_SCHEMA_DIR`, `CHROME_BINARY` and `CHROMEDRIVER_BINARY` pointing to those local files, with `GSETTINGS_BACKEND=memory`.

- Frontend lint: passed. TypeScript and Vite production build: passed; final compressed JavaScript approximately 150.5 kB (within the repository's 200 kB budget).
- Frontend unit tests with coverage: 131 passed, zero failed/skipped, 14 files.
- Backend non-race `go test -json ./...`: 134 test/subtest passes across 11 packages, zero failures/skips. `go vet`, `staticcheck`: passed. `gosec`: 18 files, zero issues.
- Backend quality script built successfully then stopped at race tests because cgo is disabled. Explicit `CGO_ENABLED=1 go test -race ./...` confirms the blocker: `C compiler "gcc" not found`. Race tests have not passed in this environment.
- `bun pm scan`: inconclusive. The configured npm audit scanner fails to parse the response (`advisories` missing) even though Bun subsequently prints “No advisories found”. Do not treat this as a clean security audit. Frozen-lockfile dependency installation succeeded without lockfile changes.
- Initial complete E2E attempt: 25 passed, 48 failed, 73 total; unconfigured container browser renderer/session failures and zero-size controls. Next complete attempt: 73 passed, one failed, 74 total; the new RTL regression reproduced the pre-fix build's inherited RTL direction. The final rebuilt runs are recorded below.
- Manual browser inspection: desktop landing and MCP section, local social PNG, 360px Arabic/RTL layout; no horizontal overflow. English MCP/FAQ blocks now use automatic content direction.
- E2E structural policy and `git diff --check`: passed. These do not replace scenario assertions or final parent review.

Final rebuilt full E2E run 1 (third overall attempt): **74/74 passed**, 14/14 files, zero skipped/failed, 165.78 seconds. JUnit policy validation also reports 74 executed with zero skips/failures.

Final rebuilt full E2E run 2 (fourth overall attempt): **74/74 passed**, 14/14 files, zero skipped/failed, 162.70 seconds. Production code was unchanged between the two passing full runs. Final JUnit policy validation reports 74 executed with zero skips/failures.


## Independent verification and reviewer discussion (2026-10-18)

Reviewed the complete tracked diff and all seven new files, including local SVG/PNG artwork and generated public documents. Confirmed MCP claims against actual handlers, routes, eight tool registrations and resource template; checked FAQ/schema parity, translation fallback, metadata cleanup and list discovery boundaries. All 21 locale JSON files parse and non-landing translation sections are unchanged. Fresh Chrome desktop/MCP and 360px Arabic screenshots were inspected, including the 1200×630 social PNG. No horizontal overflow was observed.

Separate read-only subprocesses: `codex review --uncommitted`, then two `codex exec` review discussions. Initial review found no discrete regression; targeted challenge identified initial homepage noindex as a blocker and raised generator escaping/maintenance and fallback RTL concerns. Addressed:

- Added `TestBotRenderHandler_UnknownCrawlerIndexesOnlyHome`, observed its assertion fail before the fix, then pass. Root responses now serve an indexable SPA shell before JavaScript for unknown crawlers; private deep links retain noindex. Production E2E asserts the unknown-crawler root response. Recognized crawlers retain prerendered content and User-Agent cache variation.
- English fallback paragraphs use automatic direction; extended mobile E2E assertions cover subtitle and sync description.
- Generator consistently escapes HTML values, derives FAQ keys, validates matching question/answer strings and supports non-writing `bun scripts/generate-landing.ts --check`; independently executed successfully.

Final reviewer response: “No remaining code blocker found in the inspected changes.” Bounded limitations: input remains untyped, static/React layout markup is duplicated and React retains an explicit eight-question list. Unknown crawlers still require JavaScript for product content, though initial root HTML permits indexing. Native translations remain pending; robots/noindex cannot guarantee removal of already-known URLs or provide access control. Reviewer did not execute tests; all results below are this verifier's own runs.

Independent final checks: lint and TypeScript/Vite production build pass; gzip JavaScript 150.54 kB. Frontend coverage run: 131/131 tests, 14 files, zero skips/failures (statements 85.87%, branches 78.65%, functions 84.4%, lines 88.91%). Backend `go test -json ./...`: 135 test/subtest passes across 11 packages, zero failures/skips; vet/staticcheck pass; gosec zero issues across 18 files. Backend quality script builds then stops because race requires cgo; explicit cgo-enabled race attempt fails because gcc is missing. Audit rerun reproduces scanner missing-`advisories` parsing error: inconclusive despite exit zero and “No advisories found”. Policy checker and its five unit tests pass. No tests were skipped or assertions weakened.

Superseded independent E2E attempt: 71 passed, 3 failed, 74 total, 170.56s. This run overlapped review edits and a production rebuild of shared `dist`: the newly loaded unknown-crawler/RTL assertions exercised the older server/build, and privacy encountered the production analytics build. This is an invalid final verification run, not a clean pass or evidence of a confirmed production privacy defect. Final runs use an unchanged build with no concurrent build or source edits.


Independent final full E2E run 1: **74/74 passed**, **14/14 files**, zero failures/skips, **164.29s**. JUnit policy validation confirms 74 executed with zero skips/failures.

Independent final full E2E run 2: **74/74 passed**, **14/14 files**, zero failures/skips, **164.86s**. JUnit policy validation confirms 74 executed with zero skips/failures. Production source was unchanged between these two final runs. Final diff whitespace and generated-output freshness checks pass. Commit/push/PR delivery follows explicit user authorization; task acceptance and REQ-0027 remain pending.
