---
name: requirements
description: Guidelines for documenting requirements using EARS syntax, maintaining one requirement per file.
---

# Requirements Documentation

## When to use this skill
- When defining a new feature or behavior.
- When documenting user needs.
- When refining "Vision" into testable items.

## How to use it

### 1. Atomicity Rule
- **One File = One Requirement**.
- Never combine multiple requirements in one file.
- Split independent needs.

### 2. Format & Location
- **Source**: Copy `0001_template-requirements.md`.
- **Location**: `docs/requirements/`.
- **Naming**: `0001_descriptive-name.md` (sequential numbering).

### 3. Syntax (EARS)
Each requirement **must contain exactly one requirement statement** using **EARS** syntax:
- "The system shall..."
- Pattern: `[Precondition] [Trigger] The system shall [Response]`.

### 4. Traceability
- Use explicit Markdown links to related ADRs or other Requirements.

### 5. Status Lifecycle
- `Proposed` -> `Accepted` -> `Implemented` -> `Verified` -> `Deprecated`.
- Do not change status without explicit user request.

### 6. Quality Gate
Before presenting:
- Check it is Atomic (One requirement).
- Check it uses EARS syntax.
- Check file naming and numbering.
