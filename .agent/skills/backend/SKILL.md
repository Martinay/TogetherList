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

### 3. Quality Assurance
- **Static Analysis**: All code must pass `staticcheck` and `go vet`.
- **Security**: All code must pass `gosec` security scanning. 
  - *Note on gosec G304/G703*: When using paths derived from trusted environment variables (like `STATIC_DIR`), `os.Stat` and `http.ServeFile` will trigger Path Traversal taint warnings. Resolve these by adding `// #nosec G304 G703 -- trusted path` above the offending lines after verifying the path is secure.
- **Testing**: Maintain high test coverage with `-race` detection enabled.
- **Automation**: Use the provided script to run all checks locally:
  ```bash
  .agent/skills/backend/scripts/check.sh
  ```

### 4. Bot Detection & Rendering
- **Crawler Middleware**: Use HTTP middleware to check `User-Agent` against known tokens (e.g., `GPTBot`, `Googlebot`, `WhatsApp`).
- **Conditional Serving**: Serve static, pre-rendered semantic HTML to crawlers (for SEO/GEO) while falling back to the generic SPA endpoint for human traffic.
