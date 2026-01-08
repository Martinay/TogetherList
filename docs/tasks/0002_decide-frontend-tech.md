# Decide Frontend Technology

## Goal
Evaluate and select a frontend technology stack that fits the "Vibe Coding" and "Event Sourcing" vision.

## Context
- **Vision**: `docs/vision.md` (Simple, real-time, shared lists).
- **Core Principle**: Simplicity and speed of development. 
- **Skills**: Check `docs/skills/frontend.md` for inspiration.

## Granular Instructions
1.  **Research**: Compare 2-3 options (e.g., Vanilla JS/CSS, React/Vite, Next.js).
2.  **Evaluate**: Consider "Vibe Coding" compatibility (aesthetic focus, ease of iteration).
3.  **Draft ADR**: Create `docs/adr/0002_frontend_tech.md` using the template.
4.  **Verification**: 
    - Ensure the stack supports real-time updates (Event Sourcing hydration).
    - Confirm with the user before finalizing `status.md`.

## Definition of Done
- [x] ADR `docs/adr/0002_frontend_tech.md` is drafted and presented to the user.
- [x] Automated Tests (Mock/Setup) strategy included in ADR.
- [x] `status.md` updated with the decision once accepted.
- [x] Next Task (`0003_decide_backend_tech.md`) created.
