# 22. Vertical Slice Architecture

Date: 2026-01-14

## Status

Accepted

## Context

We want to structure our application (both frontend and backend) using Vertical Slice Architecture (also known as Feature Folders). 
Currently, the project might be following a more traditional or mixed structure. 
Traditional layered architectures (Controller, Service, Repository) often lead to scattered code for a single feature, making it harder to navigate and maintain code related to a specific domain requirement.

References:
- [Vertical Slice Architecture - Eine Einführung](https://www.predic8.de/vertical-slice-architecture.htm)
- [Organizing Project Folder Structure](https://medium.com/@ikonija.bogojevic/organizing-project-folder-structure-function-based-vs-feature-based-168596b6d169)

## Decision

We will adopt Vertical Slice Architecture for both the frontend (React/Vite) and backend (Go).

### Core Principles
1.  **Organize by Feature**: Code should be grouped by the business feature it implements (e.g., `CreateList`, `ViewList`, `AddItem`), not by technical layer (e.g., `components`, `hooks`, `handlers`).
2.  **Cohesion**: All code necessary for a feature (UI, state management, API calls, backend handlers, domain logic) should be located close together.
3.  **Low Coupling**: Features should minimize dependencies on other features. Shared code should be kept to a minimum and placed in a tailored `Shared` or `Common` directory/package only when truly generic.

### Implementation Guidelines

#### Frontend (React)
Instead of:
- `src/components`
- `src/pages`
- `src/hooks`

We will have:
- `src/features/create-list/`
    - `components/`
    - `hooks/`
    - `api/`
    - `index.tsx` (Page/Entry)
- `src/features/view-list/`
    - ...
- `src/shared/` (for truly generic UI components like Button, Input)

#### Backend (Go)
Instead of:
- `internal/handlers`
- `internal/services`
- `internal/repositories`

We will have:
- `internal/features/createlist/`
    - `handler.go`
    - `service.go` (if needed)
    - `models.go`
- `internal/features/viewlist/`
    - ...

Note: Since we are using Event Sourcing, the "Slice" might encapsulate the Command definition, Command Handler, and Event definitions specific to that slice if possible, or reference shared Domain Events if they span slices.

## Consequences

### Positive
- **Maintainability**: Easier to find and modify code for a specific feature.
- **Cognitive Load**: Developers only need to understand the relevant slice, not the whole application layers.
- **Parallel Work**: Easier for multiple developers (or agents) to work on different features without conflict.

### Negative
- **Duplication**: Similar logic might be duplicated across slices to avoid coupling (this is often a trade-off accepted in VSA).
- **Initial Setup**: Requires moving existing code, which takes some effort.
