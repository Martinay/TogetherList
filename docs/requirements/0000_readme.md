# AI Agent Instructions: Requirements Documentation

## Purpose of This Document

This document defines **how the AI coding agent must work with requirements** in this repository.

It is **always attached to the system prompt** and is **authoritative** for the agent.
Humans may read it, but it is written explicitly for automated reasoning and execution.

The goal is to ensure that all requirements are:
- Atomic (one requirement per file)
- Clear, testable, and unambiguous
- Easy to locate and interpret by both humans and AI
- Maintained using **only Markdown files in the IDE**

---

## Scope and Constraints

- **Documentation format:** Markdown only
- **Granularity:** One requirement per Markdown file
- **Tooling:** No generators, no CLI tools, no databases
- **Authoring method:** Copy and adapt `0001_template.md`
- **Audience:** Developers, architects, testers, and AI agents

The AI agent must **not** assume the presence of:
- Requirements management tools
- Backlogs or ticket systems
- External requirement catalogs
- Automated traceability tooling

---

## What a Requirement Is (in This Repository)

A requirement defines **one externally observable need or constraint** that the system must satisfy.

A requirement:
- Describes *what* the system must do or guarantee
- Avoids prescribing *how* it is implemented
- Is testable and verifiable
- Is stable enough to justify documentation

---

## Mandatory Structure

All requirement files **must be created from** `0001_template.md`.
- Files live in the ADR directory (e.g. `docs/requirements/`)
- Filenames are
  - descriptive and stable (e.g. `0012-user-password-restore.md`)
  - must start with a number (e.g. `0012`)
  - the number must use the next available number (e.g. `0012` is the next available number after `0011`). Analyze the existing files in the folder `docs/requirements/` to find the next available number. 

The AI agent must ensure that:
- All required sections are present
- Placeholder values are replaced
- No additional sections are introduced without intent

Front matter fields are mandatory and must be kept consistent.

---

## Atomicity Rule (Non-Negotiable)

**Each Markdown file documents exactly one requirement.**

The AI agent must:
- Split requirements if multiple independent needs are identified
- Reject or refactor combined or compound requirements
- Avoid “catch-all” or “summary” requirement documents

If multiple requirements are discovered during a discussion, they must be documented in **separate files**.

---

## Requirement Statement Rules (EARS)

Each requirement **must contain exactly one requirement statement** written using **EARS syntax**.

Rules:
- Use “The system shall …”
- Choose the correct EARS pattern
- Avoid vague language (e.g. “should”, “as needed”, “etc.”)
- Avoid conditional behavior unless required by the pattern

The requirement statement is the authoritative source of truth.

---

## Status Lifecycle

Use the following statuses consistently:

- **Proposed** – Identified but not yet agreed
- **Accepted** – Agreed and committed
- **Implemented** – Implemented in code
- **Verified** – Proven to meet acceptance criteria
- **Deprecated** – No longer applicable, kept for history

The AI agent must **not** change status without an explicit user request.

---

## How the AI Agent Should Act

The AI agent may:
- Draft new requirement files proactively when a clear requirement emerges
- Improve clarity, structure, and testability of existing requirements
- Suggest missing acceptance or verification details
- Identify conflicts or overlaps between requirements

The AI agent must:
- Preserve user intent
- Avoid design decisions (those belong in ADRs)
- Avoid implementation detail
- Avoid silently changing meaning

---

## Traceability Expectations

Where relevant, requirements should reference:
- Related ADRs
- Dependent or derived requirements
- External sources (regulations, contracts, tickets)

Traceability is achieved through **explicit Markdown links**, not tooling.

---

## Non-Goals

This requirements practice does **not** aim to:
- Replace backlog management
- Capture implementation tasks
- Serve as design documentation
- Track progress automatically

---

## Quality Gate
Before presenting a new requirement to the user, confirm that:
- All required sections are present: Title, Date, Status, Context, Requirement (EARS), Rationale, Acceptance Criteria, Verification, Dependencies and Relationships
- The title is a short, clear noun phrase
- The rationale:
  - Integrates business value
  - Clearly explains why the selected option is preferable to the alternatives
- The record addresses exactly one requirement
- Formatting is clean and consistent (no leading whitespace, correct spacing, no duplicated sections)

---

## Final Instruction to the AI Agent

When working with requirements in this repository:

1. Follow the template exactly
2. Enforce one requirement per file
3. Use precise, testable language
4. Assume Markdown-only workflows
5. Optimize for long-term clarity and auditability

Failure to follow these rules reduces system correctness and must be avoided.
