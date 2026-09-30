# 0026: Upgrade Go to 1.27.1

## Goal
Synchronize all active Go version pins to the latest stable Go 1.27.1, verified against https://go.dev/dl/?mode=json.

## Scope
- `backend/go.mod`, `Dockerfile`, `.github/workflows/ci-cd.yml`
- `readme.md`, `docs/CICD_SETUP.md`, this task file, and the task entry in `status.md`
- No dependency updates, generated artifacts, or system Go replacement. Deliver the upgrade in a dedicated PR; leave PR #109 untouched.

## Verification
Use a checksum-verified Go 1.27.1 toolchain under `/home/martin/.hermes/cache/scratch` with `GOTOOLCHAIN=local`. Run backend tests, race tests, vet, build, staticcheck, and gosec. Keep tool installations, logs, and build output in scratch.

## Handoff
Verified with Go 1.27.1: `go test ./...`, `go vet ./...`, and `go build ./...` pass. Local race testing is blocked because the host has no C compiler (cgo is required). Docker image build and additional static/security scans were not verified locally. User acceptance is pending; review the dedicated upgrade PR before marking this task complete.
