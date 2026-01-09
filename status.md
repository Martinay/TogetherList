# Project Status

## Project Context / Vibe
**Vision**: Simple, no-auth, real-time shared lists. Event sourcing architecture.
**Current Focus**: Parallel implementation of Walking Skeleton (Frontend & Backend).

## Key Decisions
### Product Decisions (PDRs)
- **No Auth**: Users identify by display name only; stored in local storage.
- **Micro-SaaS Vibe**: "Vibe Coding" style – premium feel, minimal complexity.

### Architecture Decisions (ADRs)
- **Event Sourcing**: State derived from JSONL event log.
- [x] **Frontend Tech**: React + Vite -> `docs/adr/0002_frontend_tech.md`
- [x] **Backend Tech**: Go + net/http -> `docs/adr/0003_backend_tech.md`

## Implementation Tasks (Kanban)

### Backlog (Ready to Pick)
#### Frontend (Scope: `frontend/`)
- [ ] **Implement Landing Page** -> `docs/tasks/0005_implement_landing_page.md`
    - Create `frontend/` with Vite.
    - Implement UUID generation & Redirect.
- [ ] Implement List View

#### Backend (Scope: `backend/`)
- [ ] **Implement Event Sourcing Core** -> `docs/tasks/0006_implement_backend_core.md`
    - Create `backend/` module.
    - Define Event Structs.
    - Implement `main.go` HTTP server.

### In Progress
*(Empty - Agents pick from Backlog)*

### Done
- [x] Setup agents instructions
- [x] Decide Frontend Technology
- [x] Decide Backend Technology

## Current Recommendation
We are ready for parallel work.
- Agent A: Pick **Implement Landing Page** (`frontend/`).
- Agent B: Pick **Implement Event Sourcing Core** (`backend/`).