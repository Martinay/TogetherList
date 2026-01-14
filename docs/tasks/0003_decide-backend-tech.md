# Decide Backend Technology

## Goal
Evaluate and select a backend technology stack that supports the "Event Sourcing" architecture and complements the React + Vite frontend.

## Context
- **Vision**: `docs/vision.md` (Simple, real-time, shared lists).
- **Frontend Decision**: React + Vite (see `docs/adr/0002_frontend_tech.md`)
- **Core Requirement**: Event sourcing with JSONL file storage.
- **Skills**: Check `.agent/skills/coding/SKILL.md` for guidance.

## Granular Instructions
1.  **Research**: Compare 2-3 options (e.g., Python/FastAPI, Node.js/Express, Go).
2.  **Evaluate**: Consider event sourcing compatibility, JSONL handling, and simplicity.
3.  **Draft ADR**: Create `docs/adr/0003_backend_tech.md` using the template.
4.  **Verification**: 
    - Ensure the stack supports event sourcing patterns efficiently.
    - Confirm with the user before finalizing `status.md`.

## Definition of Done
- [x] ADR `docs/adr/0003_backend_tech.md` is drafted and presented to the user.
- [x] API design strategy included in ADR.
- [x] `status.md` updated with the decision once accepted.
- [x] Next Phase tasks (Walking Skeleton) are ready to begin.
