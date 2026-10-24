# 0035: Backend OpenTelemetry observability

Status: Implemented and locally verified; user review pending. No acceptance/commit/PR/deployment.

Scope: `backend/internal/observability/`, server wiring/tests, `backend/go.mod`/`go.sum`, `infra/`, `.github/workflows/ci-cd.yml`, observability validation scripts, requirements/ADR/operations/coverage/task docs; minimal `status.md` entry. Single writer; no unrelated production changes.

## Objective

Deliver private backend logs, metrics and traces through standard Go OTLP exporters and a real deployed Collector bridge to Azure Application Insights, preserving HTTP/SSE and optional local operation. User correction supersedes the original retention request: leave Azure/Application Insights retention at provider defaults. No retention override or custom table resource belongs in this change.

## Work

- Research official Azure/OTel sources and pin/validate a real three-signal Collector exporter.
- Test-first configuration and real-server receiver tests, then instrumentation and deployment integration.
- Cover correlation, privacy, JSONL, streaming, failures, disabled mode, sampling, shutdown and live limitations.
- Run exact local Collector-to-Application Insights protocol test, Bicep build/lint, backend tests/race/vet/static/security, frontend quality and full production E2E twice on final source.
- Leave new requirements/ADR Proposed for user acceptance; no commit/push/PR/cloud creation.

## Evidence

Backend final source: `go test -count=1 -json ./...` and `go test -count=1 -race -json ./...` each passed 92 top-level tests plus 55 subtests (147 passing test records), 12 packages, zero skips. Race detection used Zig 0.15.2's C compiler from TMPDIR. `go vet`, `staticcheck`, and `gosec` passed; gosec scanned 22 files with zero issues. A CGO-disabled Linux server build passed.

The checksum-verified contrib Collector 0.147.0 validated the deployed configuration (both file and exact Container Apps `env:OTELCOL_CONFIG` provider invocation) and passed the actual Go/JSONL/Application Insights protocol test: 3 request envelopes, 3 correlated log envelopes, 7 metric envelopes, including 404 handling, privacy canaries and real SIGTERM flush/clean exit. Bicep 0.48.1 build and lint passed; compiled ARM has no retention properties or table resources. This environment needed `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1` to run the Bicep CLI. No Docker daemon or Azure CLI/subscription deployment was available, so image construction and live Azure verification are not claimed.

Frontend checks run from an unchanged source copy under TMPDIR with locked dependencies: lint, TypeScript, build and 131 unit tests in 14 files passed. Coverage: 85.71% statements, 78.53% branches, 84.23% functions, 88.73% lines. Existing warnings: Vitest 5.0.5 / coverage-istanbul 5.0.3 mismatch and stale Browserslist data. `bun pm scan` exited zero but logged a parser error, so it is not a valid clean scan. A direct `bun audit` exited 1 with 86 existing frontend dependency advisories (37 high, 37 moderate, 12 low). Frontend manifest/lockfile are unchanged; dependency remediation is outside this backend task.

Coverage policy checks passed: 5 policy tests, 14 inventoried E2E specs, no focused/skipped tests. Full `bun run test:e2e:run` passed twice on the same unchanged production source, sequentially without overlapping builds/shared-port suites: each run passed 76 tests in 14 files with zero failures/errors/skips. Vitest durations were 182.05s and 178.90s. Both JUnit reports passed `check-e2e-policy.py --report`. The final 51 backend/deployment/check files were byte-compared with the tested snapshot. `git diff --check` passed.

Evidence is retained below `$TMPDIR`: `togetherlist-observability-final-go.json`, `togetherlist-observability-final-race.json`, `togetherlist-observability-final-{vet,staticcheck,gosec,collector}.log`, `togetherlist-observability-final-frontend-*.log`, `togetherlist-observability-final-bun-audit.log`, `togetherlist-observability-final-e2e-{1,2}.{log,xml}`, and `togetherlist-observability-final-source/frontend/e2e-artifacts{,-first}/` (browser screenshots, HTML, server logs, JSONL and JUnit). All newly generated test/build/download outputs were directed under TMPDIR. Locked dependencies were installed only in the temporary snapshot; no frontend package/lockfile was changed. [Operations](../backend-observability.md) describes limits and authoritative sources. [Inventory](../e2e-coverage.md) explains why existing frontend feature tests suffice alongside new backend integration tests.

## Handoff

Next task after user review: an authorized maintainer may create a PR from this worktree, then validate live Azure provisioning and all three signals using the operations guide. No live deployment was authorized in this task.
