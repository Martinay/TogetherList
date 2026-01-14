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
- [x] **Deployment**: Azure Container Apps -> `docs/adr/0004_deployment_strategy.md`
- [x] **Package Manager**: Bun -> `docs/adr/0005_bun_package_manager.md` (Proposed)
- [x] **Storage**: Azure Files (via Interface) -> `docs/adr/0006_storage_implementation.md`
- [x] **API Versioning**: URL Path (`/api/v1`) -> `docs/adr/0007_api_versioning.md`
- [x] **State Sync**: Short Polling (3s) -> `docs/adr/0008_state_sync_strategy.md`

## Implementation Tasks (Kanban)

### Backlog (Ready to Pick)

#### 1. ADR Decisions (Scope: `docs/adr/`)
- [x] **0017: Decide Storage Implementation** -> `docs/adr/0006_storage_implementation.md`
- [x] **0018: Decide State Sync Strategy** -> `docs/adr/0008_state_sync_strategy.md`
- [x] **0020: Decide API Versioning** -> `docs/adr/0007_api_versioning.md`
- [x] **0021: Decide Error Handling** -> `docs/adr/0021_error_handling.md`

#### 3. Backend Implementation (Scope: `backend/`)
- [x] **0007: Implement Event Sourcing** -> `docs/tasks/0007_implement_event_sourcing.md`
- [ ] **0008: Implement List API** -> `docs/tasks/0008_implement_list_api.md`
- [ ] **0009: Implement Item API** -> `docs/tasks/0009_implement_item_api.md`

#### 4. Frontend Implementation (Scope: `frontend/`)
- [x] **0005: Implement Landing Page** -> `docs/tasks/0005_implement_landing_page.md`

- [ ] **0011: Implement User Identity** -> `docs/tasks/0011_implement_user_identity.md`
- [x] **0012: Implement List View UI** -> `docs/tasks/0012_implement_list_view_ui.md`
- [x] **0013: Implement Add Item UI** -> `docs/tasks/0013_implement_add_item_ui.md`
- [ ] **0014: Implement Item Actions** -> `docs/tasks/0014_implement_item_actions.md`
- [ ] **0015: Implement Real-time Polling** -> `docs/tasks/0015_implement_realtime_polling.md`

#### 5. Integration (Scope: `frontend/` + `backend/`)
- [ ] **0016: Implement CORS & Integration** -> `docs/tasks/0016_implement_cors_and_integration.md`

### In Progress
*(Empty - Agents pick from Backlog)*

### Done
- [x] Setup agents instructions
- [x] Decide Frontend Technology -> `docs/adr/0002_frontend_tech.md`
- [x] Decide Backend Technology -> `docs/adr/0003_backend_tech.md`
- [x] **0022: Document Requirements** -> `docs/requirements/` (REQ-0002 to REQ-0012)
- [x] **0017: Decide Deployment Strategy** -> `docs/adr/0004_deployment_strategy.md`
- [x] **0006: Implement Backend Core** -> Go HTTP server with `/health` endpoint
- [x] **0020: Decide API Versioning** -> `docs/adr/0007_api_versioning.md`
- [x] **0019: Decide File Locking Strategy** -> `docs/adr/0006_storage_implementation.md` (Covered in Storage ADR)
- [x] **REQ-0002: List Creation** -> Wizard UI + backend API with event persistence
- [x] **0010: Implement Frontend Routing** -> `docs/tasks/0010_implement_frontend_routing.md`
- [x] **REQ-0006: Item Creation** -> Add item form + backend API with ItemAdded event

## Current Recommendation
Suggested execution order:
1. **Parallel**: ADR decisions (0017-0021) - Resolve architectural questions
2. **Then**: Backend (0006→0007→0008→0009) and Frontend (0005→0010→0011→0012→0013→0014→0015) in parallel
3. **Finally**: 0016 (Integration) after frontend + backend are ready