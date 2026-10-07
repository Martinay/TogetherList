# Offline implementation verification — pending acceptance

Worktree: `/home/martin/repos/TogetherList-offline-mode`. All earlier edits are preserved. No commit, push, deployment, dependency installation, version-pin change, or edits to another worktree were performed. Requirements REQ-0020–0023 and ADR-0026 remain Proposed; task 0027 remains in progress pending acceptance.

## Independent review findings

1. Safe cross-tab persistence: editing requires Web Locks in a secure context. The per-tab/test-only editing fallback is removed. Unsupported browsers show a persistent translated support notice, including while online; existing-list reads and identity selection remain available. No snapshots or queued mutations are written without Web Locks.
2. Network isolation: fetches occur outside short storage locks. Ack rereads the latest record and removes only its matching head. Refresh uses a record-version guard and projects the current queue. Replay shares an in-flight promise within each tab and uses a distinct cross-tab lock with `ifAvailable` for background calls. Replay does not refresh idle cached lists. Regression coverage includes a hanging request while another tab enqueues, a stale refresh arriving after ack, idle-list network isolation, and durable discard while another list's request hangs.
3. Permanent-rejection recovery: retained failures include HTTP status and server error text; field conflicts have a translated explanation. Non-conflict permanent failures are not blindly retried. Confirmed discard removes a failed item creation and its dependent edits, retains independent later operations with their original field preconditions, and marks same-field successors as conflicts requiring explicit retry. Final review added regressions for unrelated remote edits and same-field predecessor discard; both pass. The ordinary editors submit corrections with fresh operation UUIDs. Conflict retry remains an explicit application over shared values. Recovery/support strings exist in all 21 supported locales and have automated key/interpolation coverage.
4. Rename status: `renamelist` uses `events.WriteAppendError`. Regression test sends the same key/payload twice, then a changed payload: 200, 200, 409, with only creation and one rename persisted.

## Exact environment and commands

Commands below run from this worktree. These are the environment values used for the final runs (no system library/toolchain installation):

```bash
export PATH=/tmp/togetherlist-bun/bun-linux-x64:/home/martin/.hermes/tools/node-26.7.0-linux-x64/bin:/home/martin/.hermes/cache/scratch/togetherlist-go-1.27.1/go/bin:$PATH
export NODE_OPTIONS=--no-experimental-webstorage
export GO_BINARY=/home/martin/.hermes/cache/scratch/togetherlist-go-1.27.1/go/bin/go
export GOTOOLCHAIN=local
export GOPATH=/home/martin/.hermes/cache/scratch/togetherlist-go-1.27.1/gopath
export GOCACHE=/home/martin/.hermes/cache/scratch/togetherlist-go-1.27.1/build-cache
export CHROME_BINARY=/home/martin/.hermes/tools/chromium-1208/chrome-linux64/chrome
export CHROMEDRIVER_BINARY=/home/martin/repos/TogetherList-offline-mode/frontend/.cache/offline-browser/chromedriver
export LD_LIBRARY_PATH=/home/martin/repos/TogetherList-offline-mode/frontend/.cache/offline-browser/root/usr/lib/x86_64-linux-gnu
export FONTCONFIG_FILE=/home/martin/repos/TogetherList-offline-mode/frontend/.cache/offline-browser/fonts.conf
```

Node 26 enables native web storage; the flag above prevents it from shadowing jsdom storage in tests. An initial run without that flag failed; the final runs use it and emit no web-storage warning. The original browser test clicked the language menu instead of the item expansion button; the final selector excludes buttons with `aria-haspopup`, and each test resets CDP connectivity independently.

| Working directory | Exact command | Final result |
| --- | --- | --- |
| `frontend` | `bun run test:run` | 86 tests, 10 files pass |
| `frontend` | `bun run lint` | Exit 0 |
| `frontend` | `bun run test:offline:run` | TypeScript + production build pass; two real Chrome browser tests pass |
| `backend` | `go test -count=1 ./...` | All 11 packages pass |
| `backend` | `go build ./...` | Exit 0 |
| `backend` | `go vet ./...` | Exit 0 |
| `backend` | `/home/martin/.hermes/cache/scratch/togetherlist-go-1.27.1/bin/staticcheck ./...` | Exit 0 |
| `backend` | `/home/martin/.hermes/cache/scratch/togetherlist-ci-114/bin/gosec -fmt=json -out=../frontend/.cache/offline-gosec.json ./...` | Exit 0; 18 files, zero findings |
| `backend` | `env CGO_ENABLED=1 go test -race -count=1 ./...` | Blocked: exit 1, C compiler `gcc` not found |

Final logs are preserved under `frontend/.cache/offline-review-{unit,lint,browser,backend-tests,backend-build,backend-vet,backend-staticcheck,backend-gosec,backend-race}.log`. The local reproduction script is `frontend/.cache/verify-offline-review.sh`; invoke `bash frontend/.cache/verify-offline-review.sh frontend` or `bash frontend/.cache/verify-offline-review.sh backend`. It reports every individual exit code, including the known race blocker.

Production browser coverage uses the real backend with an isolated temporary DATA_DIR, the production service worker and build, and real Web Locks in two tabs. It verifies shell reload while disconnected, six supported pending edits, reconnection/automatic replay, one item on the backend with the final title/description/assignment/completion, prompt second-tab enqueue during a delayed first-tab acknowledgement, no second-tab mutation request while the replay lock is held, and both creations present exactly once after release. This is offline-specific browser coverage, not a rerun of every unrelated browser suite.

## Remaining limitations

- List editing requires Web Locks in a secure context. Unsupported browsers explicitly remain read-only for existing lists; HTTPS is required in production, while localhost is supported for testing. An IndexedDB fallback is outside the retained scope.
- Race tests require a C compiler; the isolated Go toolchain alone cannot run them here. Normal backend tests and analysis passed.
- Offline shell installation and list loading must happen online first. New list creation requires connectivity. Sync requires an open app tab.
- localStorage quotas and browser eviction/clearing remain constraints; failures reject edits visibly. No storage implementation prevents users clearing site data.
- Rejected payload correction uses confirmed discard followed by the existing editor, rather than an additional payload editor. Shared-field conflict retry explicitly applies saved values over shared values.
- Browser validation covers the supplied Chrome/ChromeDriver environment. Other browser engines and LCP/FCP were not measured in this pass.
- Existing dependency-audit follow-up remains a separate task; no dependencies or Go pins changed here.

## Changed-file inventory

The inventory below includes the preserved implementation and this review-fix continuation; it does not imply that every change originated in this session. Build products, logs, browser libraries and local verification tools under ignored `frontend/.cache` and `dist` are omitted.

```text
backend/cmd/server/main.go
backend/internal/events/aggregate.go
backend/internal/events/event.go
backend/internal/events/idempotency_test.go
backend/internal/events/request.go
backend/internal/events/store.go
backend/internal/features/additem/handler.go
backend/internal/features/additem/handler_test.go
backend/internal/features/assignitem/handler.go
backend/internal/features/completeitem/handler.go
backend/internal/features/createlist/handler.go
backend/internal/features/createlist/handler_test.go
backend/internal/features/edititemdescription/handler.go
backend/internal/features/renameitemtitle/handler.go
backend/internal/features/renamelist/handler.go
backend/internal/features/renamelist/handler_test.go
docs/adr/0026_durable-offline-sync.md
docs/offline-mode-verification.md
docs/requirements/0020_offline-list-access.md
docs/requirements/0021_durable-offline-edits.md
docs/requirements/0022_safe-offline-replay.md
docs/requirements/0023_offline-app-reload.md
docs/tasks/0027_implement-offline-mode.md
frontend/package.json
frontend/public/locales/ar/translation.json
frontend/public/locales/bn/translation.json
frontend/public/locales/cs/translation.json
frontend/public/locales/de/translation.json
frontend/public/locales/el/translation.json
frontend/public/locales/en/translation.json
frontend/public/locales/es/translation.json
frontend/public/locales/fr/translation.json
frontend/public/locales/hi/translation.json
frontend/public/locales/hu/translation.json
frontend/public/locales/id/translation.json
frontend/public/locales/it/translation.json
frontend/public/locales/ja/translation.json
frontend/public/locales/nl/translation.json
frontend/public/locales/pl/translation.json
frontend/public/locales/pt/translation.json
frontend/public/locales/ru/translation.json
frontend/public/locales/sv/translation.json
frontend/public/locales/tr/translation.json
frontend/public/locales/uk/translation.json
frontend/public/locales/vi/translation.json
frontend/src/App.tsx
frontend/src/api/client.ts
frontend/src/features/create-list/CreateListPage.tsx
frontend/src/features/create-list/LandingPage.tsx
frontend/src/features/offline/OfflineStatus.tsx
frontend/src/features/offline/StoredLists.tsx
frontend/src/features/offline/service-worker.js
frontend/src/features/offline/store.ts
frontend/src/features/view-list/AddItemForm.tsx
frontend/src/features/view-list/ListPage.tsx
frontend/src/features/view-list/api.ts
frontend/src/features/view-list/types.ts
frontend/src/features/view-list/useUserIdentity.ts
frontend/src/main.tsx
frontend/src/test/CreateListPage.test.tsx
frontend/src/test/OfflineStatus.test.tsx
frontend/src/test/e2e/offline.production.test.ts
frontend/src/test/offline.test.ts
frontend/src/test/service-worker.test.ts
frontend/src/test/setup.ts
frontend/vite.config.ts
frontend/vitest.offline.config.ts
status.md
```
