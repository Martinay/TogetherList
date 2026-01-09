# AI Agents rulebook

## References
Read the references as you need them.
* [Frontend Skills](docs/skills/frontend.md) See for frontend development skills.
* [Backend Skills](docs/skills/backend.md) See for backend development skills.
* [Coding Skills](docs/skills/coding.md) See for coding skills.
* [ADR Instructions](docs/adr/0000_readme-adr.md) See for Architecture Decision Record (ADR) instructions.
* [Requirement Instructions](docs/requirements/0000_readme-requirements.md) See for requirement instructions.
* [Vision](docs/vision.md) See to understand the vision.
* [Status](status.md) See to understand the status of the project.


## Folder Structure
* `docs/` folder contains documentation for the project.
* `docs/skills/` folder contains documentation for the skills of the AI agents.
* `docs/adr/` folder contains documentation for the architecture decision records (ADRs).
* `docs/requirements/` folder contains documentation for the requirements.
* `docs/tasks/` folder contains documentation for the tasks of the AI agents.
* `backend/` folder contains the backend code.
* `frontend/` folder contains the frontend code.


## Multi-Agent Coordination (Directory Isolation)
To allow multiple agents to work in parallel on the same branch, we use **Directory Isolation**.

### Rules
1.  **Scope Definition**: Every task MUST have a defined `Scope` (e.g., `frontend/`, `backend/`, `docs/`).
2.  **The "Do Not Touch" Rule**: You MUST NOT modify files outside your task's declared scope. If you need to change a shared file (like `status.md`), be extremely careful and minimize the edit window.
3.  **Orthogonal Selection**: When picking a new task, ensure its scope does NOT overlap with any currently "In Progress" task.
    - *Example*: If Agent A is doing `frontend/landing-page`, Agent B can pick `backend/api`, but NOT `frontend/login`.

## Context Handoff (Vibe Coding)
We use a "Status + Task" protocol to keep the context window small.

### Start of Session
1. **Read `status.md`**: Absorb the "Key Decisions" and "Current Recommendation".
2. **Read the Active Task**: `docs/tasks/XXX.md`.
3. **Execute**: Work on the distinct steps defined in the task.

### During Session
- **Granular Implementation**: Break work into small, verified steps (e.g., "Add UI component", "Connect API").
- **Commit Often**: If possible, suggest a git commit to the user after each logical step.
- **Testing**: If the task involves code changes, you MUST add coverage with an automated test. The task is not complete until the test is passing.

### End of Session
1. **Update `status.md`**:
   - **Tasks**: Mark completed items with `[x]`. Add new discovered tasks to "Implementation Tasks". Rearrange "Tasks" if needed
   - **Decisions**: If you made a stable Product or Arch decision, log it in "Key Decisions".
   - **Pruning**: Remove completed/irrelevant details to keep it scannable.
2. **Create Next Task**:
   - Create `docs/tasks/XXX_next_task.md`.
   - Explicitly tell the user: "Step X is complete. Please start a new session for Step Y."
3. **Notify User**: Point to the new task file.
4. **Cleanup**: Archive or delete task files that are completed, outdated, or no longer necessary to keep the `docs/tasks/` folder clean.

## Rules
1. **Respect Decisions**: Specific technology choices have already been made (see `doc/adr`). You MAY suggest alternatives if they offer significant benefits, but you MUST explicitly acknowledge that they conflict with a recorded decision.
- **ADRs** decide **HOW** we build it (Technology, Patterns, Implementation)
- **Requirements** decide **WHAT** we build it (Product, Features, Requirements)
2. **Implement Tasks**: When you are asked to implement a task, first check the `docs/tasks/` folder for the task description. Make sure that you understand the task and that you have all the information you need.
4. **Quality**: Do not advance prematurely. Optimize for excellence in the current decision or task. Ensure the current record or code is complete, unambiguous, and of high quality before proposing any subsequent step or phase.
5. **Focus**: Focus on the current decision or task. Do not make decisions about future steps or phases.
7. **Session Boundaries**: The session ends when the Task defined in `docs/tasks/` is "Done". You MUST define the next task for the subsequent agent before quitting.
8. **Require Explicit Acceptance**: After drafting or proposing an ADR or requirement, do not update STATUS.md or advance to any subsequent task until the user has explicitly accepted the decision. Acceptance must be clearly stated (e.g., “Accept Requirement X”). Never infer acceptance from silence or implied agreement, and do not proceed automatically.
9. **Skills**: Use the skills in `docs/skills/` to guide your decisions. Those are a living documentation. If there is a skill that is not documented, but you think it should be mentioned, ask the user for confirmation.
10. **Status**: `status.md` is the source of truth for the project's macro-state. You MUST read it at the start and update it at the end.
11. **Proactive Documentation Rule**: When a discussion results in a clear, stable requirement:
- Proactively draft or update the relevant requirement file
- Present the change for user review
- Do not ask for permission before drafting

This keeps documentation current and reduces friction.