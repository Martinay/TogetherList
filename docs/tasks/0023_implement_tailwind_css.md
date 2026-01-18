# Task: Implement Tailwind CSS

## Status: ✅ COMPLETED

## Context
We have decided to Adopt Tailwind CSS (see `docs/adr/0023_adopt_tailwind_css.md`) to replace our monolithic `index.css` and strictly adhere to Vertical Slice Architecture.

## Prerequisites
- Frontend is a standard Vite React Setup.
- Current CSS is located in `frontend/src/index.css`.

## Steps

### 1. Installation & Configuration
- [x] Install Tailwind CSS via `bun add -d tailwindcss @tailwindcss/vite postcss autoprefixer` in `frontend/` directory.
- [x] Configure `@tailwindcss/vite` plugin in `vite.config.ts` (Tailwind v4 uses `@theme` directive instead of `tailwind.config.js`).

### 2. Global CSS Migration
- [x] Replace contents of `frontend/src/index.css` with Tailwind v4 directives:
    ```css
    @import "tailwindcss";
    @theme { /* Golden Hour colors */ }
    ```

### 3. Component Migration (Refactoring)
Refactored all components to use Tailwind utility classes.
**Maintained exact visual fidelity.**

- [x] **Landing Page** (`features/create-list/LandingPage.tsx`)
- [x] **Wizard** (`features/create-list/wizard-steps.tsx`, `CreateListPage.tsx`)
- [x] **ListPage** (`features/view-list/ListPage.tsx`)
- [x] **ListItem** (`features/view-list/ListItem.tsx`)
- [x] **AddItemForm** (`features/view-list/AddItemForm.tsx`)
- [x] **IdentityPicker** (`features/view-list/IdentityPicker.tsx`)
- [x] **Greeting** (`features/view-list/Greeting.tsx`)
- [x] **ShareButton** (`features/view-list/ShareButton.tsx`)

### 4. Cleanup
- [x] Removed all 861 lines of legacy BEM CSS from `index.css` (now 66 lines).
- [x] No legacy BEM classes remain in `.tsx` files.

## Verification
- [x] Run `bun dev` and visually verified UI parity (gradient titles, buttons, focus rings, background glow).
- [x] All 21 existing tests pass (`bun test:run`).
