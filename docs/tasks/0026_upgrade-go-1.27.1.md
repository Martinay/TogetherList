# 0026: Upgrade Go to 1.27.1

## Goal
Synchronize all active Go version pins to the latest stable Go 1.27.1, verified against https://go.dev/dl/?mode=json.

## Scope
- `backend/go.mod`, `Dockerfile`, `.github/workflows/ci-cd.yml`
- `readme.md`, `docs/CICD_SETUP.md`, this task file, and the task entry in `status.md`
- PR #114 follow-up: `backend/cmd/server/spa.go` and `spa_test.go` for rooted static serving and security regressions.
- No dependency updates, generated artifacts, or system Go replacement. Deliver the upgrade in a dedicated PR; leave PR #109 untouched.

## Verification
Use a checksum-verified Go 1.27.1 toolchain under `/home/martin/.hermes/cache/scratch` with `GOTOOLCHAIN=local`. Run backend tests, race tests, vet, build, staticcheck, and gosec. Keep tool installations, logs, and build output in scratch.

## Handoff
PR #114 follow-up replaces path-based SPA serving with `os.OpenInRoot` and `http.ServeContent`, without suppressions. Regression tests cover traversal (including encoded paths), escaping and contained symlinks, nested assets, root/directory/route fallback, missing files, and an escaping index symlink. Security report upload uses `if: always()`.

Verified with Go 1.27.1 (`GOMAXPROCS=2 GOFLAGS=-p=2 GOTOOLCHAIN=local`): backend tests, vet, build, staticcheck, and installed gosec v2.29.0 pass; gosec reports zero findings (`/home/martin/.hermes/cache/scratch/togetherlist-ci-114/gosec-fixed.json`). Race tests remain blocked by the host's missing C compiler. Docker build was not verified. Independent review passed after adding trailing-slash route regressions. The fix is delivered on PR #114; task remains in progress pending GitHub CI verification and user acceptance. No merge performed.
