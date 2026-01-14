---
name: backend
description: Best practices and architectural guidelines for backend development, focusing on Vertical Slice Architecture in Go.
---

# Backend Development Standards

## When to use this skill
- When writing Go code.
- When structuring backend directories.
- When creating new backend features or endpoints.

## How to use it

### 1. Architecture: Vertical Slice
Implement **Vertical Slice Architecture** (Feature Folders).
- Organize code by feature (e.g., `internal/features/myfeature`).
- Encapsulate handlers, logic, and models specific to that feature together.
- **Avoid** horizontal layers like `handlers/`, `services/`, `repositories/` unless they are truly generic and widely reused.

### 2. Best Practices
- Follow standard Go project layout where applicable (e.g., `cmd/`, `internal/`).
- Use `internal/` to hide private packages.
