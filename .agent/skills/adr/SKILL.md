---
name: adr
description: Instructions for creating Architecture Decision Records (ADRs) using MADR format, including mandatory economic cost evaluation.
---

# Architecture Decision Records (ADR)

## When to use this skill
- When making a significant architectural decision (technology choice, pattern adoption, structural change).
- When documenting a decision that affects the long-term maintainability or cost of the system.

## How to use it

### 1. Mandatory Format (MADR)
- **Format**: Markdown (`.md`) only.
- **Template**: Copy `0001_template-adr.md`.
- **Tooling**: IDE + Markdown files only. No other tools.

### 2. Mandatory Economic Evaluation
Every ADR **must explicitly evaluate each considered option** against **3 Cost Categories**:
1.  **Building (Development)**: Authoring, Project Scale, Onboarding, AI Assistance.
2.  **Running (Operations)**: Runtime, Deployment, Maintenance & Debugging.
3.  **Externalities**: Interoperability, Security.

*This evaluation must appear as a dedicated subsection under "Considered Options" for EACH option.*

### 3. Required Sections
1.  **Front Matter**: `status`, `date`, `deciders`.
2.  **Title**: `AD: <Short title>`.
3.  **Context and Problem Statement**: The "Why".
4.  **Decision Drivers**: Forces and constraints.
5.  **Considered Options**: Numbered list of options + Cost Evaluation.
6.  **Decision Outcome**: Selected option + Rationale (referencing costs).
7.  **Consequences**: Positive and negative impacts.

### 4. Lifecycle Rules
- **New ADRs**: Start as `Proposed`.
- **Modifications**: *Never* modify `Accepted/Rejected`. Create a new ADR that supersedes.
- **Acceptance**: Do not mark as `Accepted` until explicitly instructed by the user.

### 5. Quality Gate
Before presenting:
- Check all sections are present.
- Check "The 3 Cost Categories" are evaluated for every option.
- Ensure only one decision per record.
