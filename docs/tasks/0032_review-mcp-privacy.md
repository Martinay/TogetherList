# Review MCP privacy removal

Scope: MCP backend, related tests and documentation in this worktree.

Implementation is ready for review; acceptance and environment-dependent checks remain pending. No commit, push or deployment was performed. No architecture change or new ADR is needed.

Removed list_lists registration, handler, summary type and unused storage ListIDs helper. Preserved all eight other tools and known-ID resource access. Resource discovery reveals no stored list instances. Updated REQ-0019 without changing its status.

Red and green command, from backend/:

~~~sh
go test ./internal/features/mcpserver -run 'TestServer_(DirectJSONRPC_ToolsList|RejectsListEnumeration)$' -v
~~~

Red: two failures (nine advertised tools including list_lists, enumeration call returned successful []). Green: both passed.

Additional validation:
- Backend: go test ./internal/features/mcpserver ./internal/events ./cmd/server passed all three packages.
- Backend: go test ./... passed all 11 packages; go test -json ./... recorded 126 test/subtest passes.
- Backend: go vet ./..., staticcheck ./..., gosec -fmt=text ./... passed; zero gosec findings.
- Repository backend check script built successfully, stopped at race tests because cgo is disabled.
- Backend: CGO_ENABLED=1 go test -race ./... failed because gcc is absent.
- Frontend: bun run test:run passed 131 tests in 14 files; bun run lint and bun run build passed.
- Frontend: bun run test:e2e:run attempted twice; both built, both failed global setup with zero tests executed. ChromeDriver cannot load libnspr4.so.
- Dependency installation succeeded; npm security scanner reported an audit-response schema error.

Next steps:
- Run full browser E2E twice with Chrome/ChromeDriver system dependencies available.
- Run backend race/quality script with a C compiler.
- Review implementation and requirement wording; obtain user acceptance before recording completion in status.md.

See [coverage inventory](../e2e-coverage.md) for exact updated MCP scenarios. No status or requirement lifecycle transition was made. Temporary verification tooling was downloaded only inside this worktree and cleaned up.
