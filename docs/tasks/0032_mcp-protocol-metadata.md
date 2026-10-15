# 0032: MCP protocol metadata and exact endpoint routing

Scope: `backend/cmd/server/`, `backend/internal/features/mcpserver/`, existing MCP E2E spec, coverage inventory and this handoff; minimal status entry only.

User-requested fixes are implemented; acceptance is pending. No deployment, merge, delete tool or production-data access is included.

## Proposed REQ-0019 clarification for review

When a client requests `tools/list`, the system shall advertise `get_list` as read-only, non-destructive and idempotent. When a client sends GET to exact `/mcp` or `/api/v1/mcp`, the system shall return 405 with `Allow: POST` rather than SPA HTML. Existing direct POST and legacy SSE/message endpoints remain supported.

This records the requested contract for review without changing the accepted requirement's lifecycle. Existing ADR 0025 already covers the transports; no new architecture decision is needed.

## Annotation audit

`get_list` only reads and reconstructs events. `create_list` and `add_item` allocate fresh UUIDs; all seven mutation tools append timestamped events on every successful call. Retain conservative writable/non-idempotent metadata for these tools, including setters whose repeated calls still grow the event log. Retain conservative `destructiveHint: true` (particularly for overwritten names, assignments, descriptions and completion attribution) and `openWorldHint: true` for shared data that other participants can change. No stronger guarantees are introduced.

## Verification and handoff

Both Go regressions failed before production edits: the routing test exposed HTML 200 on `/mcp` and 404 on the API alias; tools/list exposed all three wrong get_list hints. Afterwards `go test ./... -count=1 -json` passed 133 tests/subtests across 11 packages, including direct POST and legacy SSE lifecycle tests. Vet, staticcheck and gosec passed (18 files, zero findings). Frontend unit tests: 131 passed in 14 files; lint and production build passed.

Backend check script built successfully but stopped at `-race` because cgo is disabled. Explicit `CGO_ENABLED=1 go test -race ./cmd/server ./internal/features/mcpserver ./internal/events` failed to build because gcc is absent. Two full `bun run test:e2e:run` attempts built successfully but global setup could not start ChromeDriver (missing libnspr4.so); zero browser tests executed. The dependency audit scanner also reported an invalid response schema; installation succeeded, audit cleanliness is unverified.

Next step: reviewer/CI reruns race and both full E2E passes with a C compiler and browser runtime installed, reviews the proposed REQ-0019 clarification, and obtains user acceptance. Do not mark complete before acceptance. No additional feature work is proposed.
