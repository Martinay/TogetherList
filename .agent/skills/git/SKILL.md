---
name: git
description: Git workflow standards regarding branch naming, commit messages, and commit policies.
---

# Git Workflow Standards

## When to use this skill
- When creating branches.
- When committing code.
- When pushing changes.

## How to use it

### 1. Branch Naming
- Use `feature/<task-id>-<description>` or `fix/<task-id>-<description>`.

### 2. Commit Messages
- Use **Conventional Commits** format: `type(scope): description`.
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- Example: `feat(auth): implement login handler`.

### 3. Atomic Commits
- Each commit should represent one logical change.

### 4. Safety Rules
- **Never Force Push**: Do not force push to shared branches.
- **No Automatic Commits**: You must NOT commit code automatically. Only suggest commits and provide commit messages for the user to execute.
