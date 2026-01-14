---
name: coding
description: General coding standards including commenting, versioning, testing (TDD), and file naming conventions.
---

# General Coding Standards

## When to use this skill
- When writing code in any language.
- When interpreting CLI output.
- When deciding on versioning.

## How to use it

### 1. Comments
- Avoid adding unnecessary comments.
- Only include comments when they are strictly essential for clarity (explain *why*, not *what*).

### 2. Version Selection
- Adhere to version requirements specified in ADRs and PDRs.
- If no specific version is mandated, default to the latest **LTS (Long-Term Support)** version for all frameworks, tools, and libraries.

### 3. Testing
- Use **Test-Driven Development (TDD)** approach when applicable.
- Propose code changes only *after* the corresponding tests have been written and passed.
- **Every new functionality must be covered by automated tests.**

### 4. CLI Warnings
- If any CLI command produces warnings or notices, **resolve them before continuing**.
- This includes understanding the warning, executing any recommended remediation steps, and verifying that the issue is fully resolved.
- Do not proceed to subsequent tasks until all warnings have been cleared.

### 5. Single Responsibility
- Each file, method, or class should have a single responsibility.
- If a entity has multiple responsibilities, split it.

### 6. KISS principle
- Avoid over-engineering. Keep it simple, stupid.