# AI Agents Rulebook And Skills Index

This file serves as the entry point for AI agents working on this repository.

## Source of Truth
* [Status](status.md): The central synchronization point for the project's state. You MUST read this first.

## Workflow & Protocol
* [Workflow Skill](.agent/skills/workflow/SKILL.md): **MANDATORY**. Defines how to work, coordinate, and hand off context (Vibe Coding).

## Domain Skills
You MUST read the relevant skill when working in that domain.

* [Frontend](.agent/skills/frontend/SKILL.md): Architecture, UI/UX, and performance standards.
* [Backend](.agent/skills/backend/SKILL.md): Go standards, architecture, and libraries.
* [Coding](.agent/skills/coding/SKILL.md): General coding, testing, and commenting standards.
* [Git](.agent/skills/git/SKILL.md): Branching, committing, and PR standards.
* [ADR](.agent/skills/adr/SKILL.md): How to write Architecture Decision Records.
* [Requirements](.agent/skills/requirements/SKILL.md): How to write EARS requirements.

## Documentation
* [Vision](docs/vision.md): Key product ideas.
* [Tasks](docs/tasks/): Folder containing active and future agent tasks.

## Proactive Actions
* Update or create requirements in case something changes without the user asking for doing that.
* Create ADRs proactive in case you see a gap.

## Required E2E Coverage

* Every new or changed user-facing feature MUST include real frontend/backend/JSONL-storage end-to-end tests in the same change, including applicable unhappy paths, persistence, identity/sharing, collaboration and offline behavior.
* Update [the feature-to-test inventory](docs/e2e-coverage.md) with exact scenarios, tests and remaining gaps. For nonbehavioral production changes, document the reason existing tests suffice for reviewer approval.
* Run `bun run test:e2e:run` from `frontend/`, repeat for flake detection, run existing quality checks and report actual counts/results. Never skip/focus/conditionally omit tests or weaken assertions to pass.
* Use test-first reproduction and the minimal fix for production bugs. Follow [CONTRIBUTING.md](CONTRIBUTING.md) and the PR checklist.
* Structural CI guardrails do not prove feature completeness. Reviewers and agents must inspect coverage against actual routes/actions and assess omissions honestly.
