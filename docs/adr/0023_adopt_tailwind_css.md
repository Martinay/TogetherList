---
status: Accepted
date: 2026-01-18
deciders: Martin, Antigravity
consulted: None
informed: None
---

# AD: Adopt Tailwind CSS for Styling

## Context and Problem Statement

The current frontend application relies on a single, monolithic `index.css` file that has grown to over 800 lines. This architecture violates the Vertical Slice Architecture principles adopted by the project (ADR 0022), creates high coupling between unrelated features, and poses significant maintainability challenges. As the application grows, managing a global namespace and locating dead code will becoming increasingly difficult and error-prone.

## Decision Drivers

*   **Maintainability**: We need a styling solution that scales with the codebase and allows safe deletion of code.
*   **Architecture Alignment**: The styling solution must support Vertical Slice Architecture (co-location of styles with features).
*   **Development Speed**: We want to reduce context switching between TSX and CSS files.
*   **Consistency**: We need to enforce a consistent design system (colors, spacing, typography) without relying on manual variable usage.
*   **Performance**: We need to ensure minimal CSS bundle size.

## Considered Options

### 1. Monolithic CSS (Status Quo)
Keep adding styles to `src/index.css`.

*   **Cost Evaluation**:
    *   **Building**: 
        *   *Authoring*: Easy to start, but gets harder as file grows. High cognitive load scrolling through thousands of lines. 
        *   *Onboarding*: Chaotic. New developers won't know where to put styles.
    *   **Running**: 
        *   *Performance*: Browser loads all styles even for unused pages.
    *   **Externalities**:
        *   *Security*: N/A.

### 2. CSS Modules
Co-locate `.module.css` files with components.

*   **Cost Evaluation**:
    *   **Building**:
        *   *Authoring*: Standard CSS syntax. Requires creating and importing separate files (context switching).
        *   *Scale*: Excellent isolation. Solves the global namespace issue perfectly.
    *   **Running**:
        *   *Performance*: Good, but potential for duplication if common patterns aren't abstracted.
    *   **Externalities**:
        *   *Interoperability*: Native support in Vite.

### 3. Tailwind CSS
Utility-first CSS framework.

*   **Cost Evaluation**:
    *   **Building**:
        *   *Authoring*: Extremely fast. No context switching. Styles live in markup.
        *   *Onboarding*: Steep initial learning curve for class names, but industry standard.
        *   *AI Assistance*: LLMs are excellent at writing Tailwind.
    *   **Running**:
        *   *Performance*: Excellent. Generates minimal CSS bundle (PurgeCSS).
    *   **Externalities**:
        *   *Ecosystem*: Massive ecosystem of plugins and components.

## Decision Outcome

Chosen option: **Tailwind CSS**.

**Rationale**: 
Tailwind CSS provides the best balance of maintainability, development speed, and runtime performance. 
1.  **Architecture**: It allows us to style components completely within the feature slice (in the `.tsx` file), removing the need for separate sidecar files like CSS Modules, which aligns even more tightly with "keeping things together".
2.  **Consistency**: It enforces the design system via `tailwind.config.js`, preventing "magic values" better than manual CSS variables.
3.  **Efficiency**: It eliminates the "append-only" CSS problem; when you delete a React component, its styles are gone instantly.

## Consequences

### Positive
*   **Eliminated Global CSS**: We will move away from the maintenance burden of a large `index.css`.
*   **Smaller Bundle**: Unused styles are automatically removed at build time.
*   **Faster Iteration**: Developers can style elements without leaving the JSX structure.
*   **Standardization**: Constraints on spacing/colors are enforced by the framework.

### Negative
*   **Markup Clutter**: JSX code will look busier with class strings.
*   **Learning Curve**: Team must learn Tailwind utility class names.
*   **Migration Effort**: We will need to rewrite the existing 800+ lines of CSS into Tailwind utilities.
