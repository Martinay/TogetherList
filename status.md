# Project Status

## Project Context / Vibe
**Vision**: Simple, no-auth, real-time shared lists. Event sourcing architecture.
**Current Focus**: Establishing the core technology stack via ADRs.

## Key Decisions
### Product Decisions (PDRs)
- **No Auth**: Users identify by display name only; stored in local storage.
- **Micro-SaaS Vibe**: "Vibe Coding" style – premium feel, minimal complexity.

### Architecture Decisions (ADRs)
- **Event Sourcing**: State derived from JSONL event log.
- [ ] **Frontend Tech**: [Pending] -> `docs/adr/0002_frontend_tech.md`
- [ ] **Backend Tech**: [Pending] -> `docs/adr/0003_backend_tech.md`

## Implementation Tasks
### Phase 1: Foundation (Current)
- [x] Initial Requirements Analysis
- [x] Setup agents instructions (`docs/tasks/0001_setup_agents_instructions.md`)
- [ ] **Decide Frontend Technology** (`docs/tasks/0002_decide-frontend-tech.md`) <!-- Active -->
- [ ] Decide Backend Technology (`docs/tasks/0003_decide-backend-tech.md`)

### Phase 2: Walking Skeleton (Planned)
- [ ] Implement Landing Page
- [ ] Implement List View (`/list/<uuid>`)
- [ ] Implement Event Sourcing Backend

## Current Recommendation
Start with the Frontend Tech stack decision. It determines the "vibe" and development speed of the UI.