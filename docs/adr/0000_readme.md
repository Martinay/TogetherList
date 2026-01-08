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
- **Templates:** ADRs are created by copying `0001_template.md`  
- **Audience:** Developers and architects  
- **This document:** Instructions for the AI agent only

The AI agent must **not** introduce:
- Alternative ADR formats (e.g., Nygard, Y-Statements)
- Tool-specific metadata
- Automation assumptions (CLI, scripts, generators)

---

## Mandatory Economic Evaluation: The 9 Cost Factors

Every ADR **must explicitly evaluate each considered option** against the following **nine cost factors**:

1. **Authoring** – Cost of writing, reading, and changing code
2. **Project Scale** – Suitability for large codebases and teams
3. **Onboarding** – Hiring availability and ramp-up time
4. **Maintenance & Debugging** – Long-term effort to fix and evolve the system
5. **Runtime** – Operational and performance-related costs
6. **Deployment** – Build, test, and release complexity
7. **AI Assistance** – Effectiveness of AI tools for this technology
8. **Interoperability** – Ease and cost of integration with other systems
9. **Security** – Risk, mitigation effort, and ecosystem maturity

These factors represent **total lifecycle cost**, not just initial implementation effort. Include this in your reasoning.
https://spf13.com/p/the-9-factors/

---

## Required Evaluation Rules

- **Every ADR must include an explicit evaluation of the 9 cost factors**
- **Every considered option must be evaluated against all 9 factors**
- Evaluations must be **qualitative and concise** (e.g., short bullet points)
- Do **not** omit factors because they seem irrelevant; explain low impact instead
- Trade-offs must be made explicit

### Required Placement

The evaluation must appear as a dedicated subsection under **Considered Options**, for example:

```markdown
#### Option 1: <Name>

* Authoring: ...
* Project Scale: ...
* Onboarding: ...
* Maintenance & Debugging: ...
* Runtime: ...
* Deployment: ...
* AI Assistance: ...
* Interoperability: ...
* Security: ...
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
- **Each option must include a full 9 cost factor evaluation**

---

### Decision Outcome (Required)

Describe:
- The selected option
- The rationale for choosing it
- Why other options were not chosen

The rationale must reference **cost factor trade-offs** where relevant.

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
-The rationale:
  - Integrates relevant cost factors (“The 9 Cost Factors”)
  - Clearly explains why the selected option is preferable to the alternatives
- The record addresses exactly one decision
- Formatting is clean and consistent (no leading whitespace, correct spacing, no duplicated sections)

---

## Final Instruction to the AI Agent

When working in this repository:

1. **Always follow MADR**
2. **Always evaluate all options using the 9 cost factors**
3. **Keep evaluations concise and comparative**
4. **Use Markdown only, no tooling assumptions**
5. **Optimize for long-term economic understanding**

Failure to apply the cost factor evaluation invalidates the ADR.

