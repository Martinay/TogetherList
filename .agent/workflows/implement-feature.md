---
description: How to implement a new feature end-to-end (backend + frontend)
---

# Implement a New Feature

Follow these steps to implement a new feature from requirements to verified code.

## 1. Analyze the Codebase

- Read `status.md` for current project state.
- Read the relevant skill files: `backend`, `frontend`, `coding`, `requirements`.
- Identify the existing feature slices (`backend/internal/features/`, `frontend/src/features/`) and patterns.
- Check `docs/requirements/` for an existing requirement related to the feature.
- Check `docs/vision.md` for any pre-defined event schemas.

## 2. Ask Clarifying Questions

- Act as a **Senior Technical Product Manager**.
- Identify missing edge cases and UI/UX constraints.
- Ask the user **3–10 targeted questions** covering:
  - UI interaction model (e.g., checkbox vs button vs swipe)
  - Data positioning and visibility (e.g., grouping, sorting, hiding)
  - Permission model (who can perform the action?)
  - Data tracking (what metadata to store in events?)
  - Error handling and undo behavior
  - Visual treatment and styling
- **Do not proceed** until the user answers.

## 3. Create an Implementation Plan

- Create `implementation_plan.md` as an artifact.
- Group changes by component (Events → Handler → Router → Frontend Types → API → UI → i18n → Tests).
- Include a **Verification Plan** with exact commands.
- Submit for user approval via `notify_user`.
- **Do not proceed** until approved.

## 4. Implement Backend (TDD)

Follow the **Vertical Slice Architecture** pattern:

// turbo
1. Add event type constant and payload struct to `backend/internal/events/types.go`.
// turbo
2. Add event handling in `backend/internal/events/aggregate.go`.
// turbo
3. Write aggregate tests in `backend/internal/events/aggregate_test.go`.
// turbo
4. Create a new feature folder: `backend/internal/features/<featurename>/handler.go`.
// turbo
5. Write handler tests: `backend/internal/features/<featurename>/handler_test.go`.
// turbo
6. Register the route in `backend/cmd/server/main.go`.
// turbo
7. Run backend tests:
```bash
cd backend && go test ./... -race
```

## 5. Implement Frontend

Follow the **Feature Folder** pattern:

// turbo
1. Update types in `frontend/src/features/<slice>/types.ts`.
// turbo
2. Add API function to `frontend/src/features/<slice>/api.ts`.
// turbo
3. Add i18n keys to `frontend/src/i18n/locales/en.json`.
// turbo
4. Update or create UI components in the feature folder.
// turbo
5. Write unit tests using Vitest + Testing Library.
// turbo
6. Run frontend tests:
```bash
cd frontend && bun run test:run
```

## 6. Add E2E Tests

// turbo
1. Create `frontend/src/test/e2e/<feature>.e2e.test.ts`.
2. Use the WebdriverIO + headless Chrome pattern from `browser-helper.ts`.
3. The global setup auto-starts both the Go backend and Vite dev server.
// turbo
4. Run e2e tests:
```bash
cd frontend && bun run test:e2e:run
```

## 7. Run Full Verification

// turbo
1. Backend tests with race detection:
```bash
cd backend && go test ./... -race
```
// turbo
2. Backend static analysis (staticcheck + gosec):
```bash
bash .agent/skills/backend/scripts/check.sh
```
// turbo
3. Frontend unit tests:
```bash
cd frontend && bun run test:run
```
// turbo
4. E2E tests:
```bash
cd frontend && bun run test:e2e:run
```

## 8. Wrap Up

1. Create a `walkthrough.md` artifact summarizing changes, tests, and results.
2. Follow the **Context Handoff** protocol from the `workflow` skill:
   - Update `status.md` and requirements (after user confirmation).
   - Create next task file in `docs/tasks/` if applicable.
   - Clean up completed task files.
