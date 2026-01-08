# AI Agent Instructions: Architecture Decision Records (ADR) using MADR

## Purpose of This Document

This document defines **how this AI agent must work with Architecture Decision Records (ADRs)** in this repository.

It is **read-only** for humans and **authoritative** for the AI agent.

The goal is to ensure that all ADRs:
- Follow the **Markdown Architectural Decision Records (MADR)** standard
- Are consistent, clear, and decision-focused
- Explicitly evaluate architectural options against **economic cost factors**
- Are created and maintained **without any tooling**, using only Markdown files in the IDE

This repository explicitly does **not** use CLI tools, generators, or ADR automation frameworks.

---

## Scope and Constraints

- **ADR format:** MADR only  
- **File format:** Markdown (`.md`)  
- **Tooling:** IDE + Markdown files only  
- **Templates:** ADRs are created by copying `0001_template-adr.md`  
- **Audience:** Developers and architects  
- **This document:** Instructions for the AI agent only

The AI agent must **not** introduce:
- Alternative ADR formats (e.g., Nygard, Y-Statements)
- Tool-specific metadata
- Automation assumptions (CLI, scripts, generators)

---

## Mandatory Economic Evaluation: The 3 Cost Categories

Every ADR **must explicitly evaluate each considered option** against the following **three cost categories**:

### 1. Building (Development)
Costs incurred while creating and evolving the codebase:
- **Authoring** – Cost of writing, reading, and changing code
- **Project Scale** – Suitability for large codebases and teams
- **Onboarding** – Hiring availability and ramp-up time
- **AI Assistance** – Effectiveness of AI tools for this technology

### 2. Running (Operations)
Costs tied to executing, deploying, and maintaining running systems:
- **Runtime** – Operational and performance-related costs
- **Deployment** – Build, test, and release complexity
- **Maintenance & Debugging** – Long-term effort to fix and evolve the system

### 3. Externalities
Costs arising from ecosystem, tooling, security, and integration:
- **Interoperability** – Ease and cost of integration with other systems
- **Security** – Risk, mitigation effort, and ecosystem maturity

These categories represent **total lifecycle cost**, not just initial implementation effort. Include this in your reasoning.
Inspired by: https://spf13.com/p/the-9-factors/

---

## Required Evaluation Rules

- **Every ADR must include an explicit evaluation of the 3 cost categories**
- **Every considered option must be evaluated against all 3 categories**
- Evaluations must be **qualitative and concise** (e.g., short bullet points)
- Do **not** omit categories because they seem irrelevant; explain low impact instead
- Trade-offs must be made explicit

### Required Placement

The evaluation must appear as a dedicated subsection under **Considered Options**, for example:

```markdown
#### Option 1: <Name>

**Building (Development)**:
- Authoring: ...
- Project Scale: ...
- Onboarding: ...
- AI Assistance: ...

**Running (Operations)**:
- Runtime: ...
- Deployment: ...
- Maintenance & Debugging: ...

**Externalities**:
- Interoperability: ...
- Security: ...
```

This structure is mandatory.

---

## Required ADR Structure (MADR)

Each ADR **must contain** the following sections in this order.

### Front Matter (Required)

```markdown
---
status: Proposed | Accepted | Rejected | Superseded | Deprecated
date: YYYY-MM-DD
deciders: <names or roles>
---
```

Rules:
- `status` must reflect the current lifecycle state
- `date` is the decision date, not the last edit date
- `deciders` identifies who made the decision

---

### Title (Required)

```markdown
# AD: <Short, precise decision title>
```

Rules:
- Start with `AD:`
- Describe **the decision**, not the topic

---

### Context and Problem Statement (Required)

Explains:
- The problem to be solved
- The architectural context
- Why a decision is required now

The AI agent must:
- Avoid solution bias
- Clearly separate problem from solution

---

### Decision Drivers (Required)

List the forces influencing the decision, such as:
- Quality attributes
- Constraints
- Business goals
- Technical limitations

Rules:
- Use bullet points
- Be concrete and specific

---

### Considered Options (Required)

A numbered list of **realistic and viable** options.

Rules:
- Include the chosen option
- Include rejected alternatives
- Do not list strawman options
- **Each option must include a full 3 cost category evaluation**

---

### Decision Outcome (Required)

Describe:
- The selected option
- The rationale for choosing it
- Why other options were not chosen

The rationale must reference **cost category trade-offs** where relevant.

---

### Consequences (Required)

Describe the impact of the decision.

Rules:
- Include **positive and negative** consequences
- Use bullet points
- Focus on long-term implications

---

### More Information (Optional but Recommended)

Include:
- Links to relevant documentation
- References to patterns, papers, or standards
- Follow-on decisions that may be required

---

## ADR Lifecycle Rules

- **Never modify** records with status `Accepted`, `Rejected`, or `Superseded`
- If a decision changes, **create a new ADR** that supersedes the previous one
- **Only `Proposed` records may be edited**
- **All new ADRs must start with status `Proposed`**
- **Do not mark any ADR as `Accepted` unless explicitly instructed by the user**

---

## Quality Gate
Before presenting a new ADR to the user, confirm that:
- All required sections are present: Title, Date, Status (Proposed), Context, Alternatives Considered, Decision, Rationale, Consequences / Expected Impact
- The title is a short, clear noun phrase
- The rationale:
  - Integrates relevant cost categories ("The 3 Cost Categories")
  - Clearly explains why the selected option is preferable to the alternatives
- The record addresses exactly one decision
- Formatting is clean and consistent (no leading whitespace, correct spacing, no duplicated sections)

---

## Final Instruction to the AI Agent

When working in this repository:

1. **Always follow MADR**
2. **Always evaluate all options using the 3 cost categories**
3. **Keep evaluations concise and comparative**
4. **Use Markdown only, no tooling assumptions**
5. **Optimize for long-term economic understanding**

Failure to apply the cost category evaluation invalidates the ADR.

