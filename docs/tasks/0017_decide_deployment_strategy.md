# Decide Deployment Strategy

## Goal
Create an ADR that defines how TogetherList will be deployed and hosted.

## Scope
- **Directory**: `docs/adr/`
- **Files**: `docs/adr/0004_deployment_strategy.md`

## Context
- **Frontend**: React + Vite (static assets)
- **Backend**: Go binary with JSONL file storage
- **Need to decide**: Hosting platform, container strategy, how static files are served.

## Granular Instructions
- [ ] Research deployment options:
    - Docker Compose (self-hosted)
    - Cloud Run / App Engine (GCP)
    - Fly.io / Railway
    - Vercel (frontend) + separate backend host
- [ ] Evaluate based on:
    - Cost for micro-SaaS
    - Simplicity of deployment
    - File persistence (JSONL storage needs persistent disk)
    - Single vs split deployment
- [ ] Draft ADR at `docs/adr/0004_deployment_strategy.md`.
- [ ] Address: Will Go serve static frontend files, or separate hosting?

## Definition of Done
- [ ] ADR created with clear decision and rationale.
- [ ] `status.md` updated with new Key Decision.
- [ ] Next Task created if needed.
