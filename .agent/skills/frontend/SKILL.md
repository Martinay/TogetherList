---
name: frontend
description: Guidelines for frontend development including Vertical Slice Architecture, UI/UX design principles, and performance budgets.
---

# Frontend Development Standards

## When to use this skill
- When writing frontend code (React, HTML, CSS).
- When designing UI/UX.
- When optimizing frontend performance.

## How to use it

### 1. Architecture
- Implement **Vertical Slice Architecture** (Feature Folders).
- Organize code by feature (e.g., `src/features/my-feature`), grouping components, hooks, api, and styles together.
- **Avoid** grouping by type (e.g., `components/`, `hooks/`) at the top level.

### 2. Aesthetics & Design
- **Typography**: Don't just use generic fonts. Pick something interesting.
- **Color & Theme**: Commit to a cohesive color palette. Instead of using 10 colors, use 2-3 dominant colors with sharp accents. Do not use blue and purple as it is used by all AI applications.
- **Motion**: Use animations strategically. Do not overload it with animations.
- **Spatial Composition**: Break the grid. Use asymmetry. Overlap elements. Create unexpected layouts.
- **Backgrounds & Details**: Don't just use solid colors. Add textures, subtle gradients, decorative elements that match your aesthetic.

### 3. UX & Internationalization
- **Responsive Design**: Ensure the UI works seamlessly on mobile phones, tablets, and laptops using fluid layouts, media queries, and responsive components.
- **UX First**: Create the UI so it is easy to use and intuitive. A 10 year old child should be able to use it without any issues.
- **i18n**: Make sure that the UI always supports multiple languages. All strings must be loaded from a translation file.

### 4. Performance Budgets
All pages must meet these thresholds:
- **LCP** (Largest Contentful Paint): < 2.5 seconds
- **FCP** (First Contentful Paint): < 1.8 seconds
- **Initial Bundle size**: ≤ 200 KB (compressed)

### 5. SEO & GEO (Generative Engine Optimization)
- **Dual-Layer Strategy for SPAs**: Since SPAs use a generic `index.html` fallback, serve a fully prerendered static HTML file (e.g., `landing.html`) explicitly to crawlers via backend user-agent detection. Serve the normal SPA to human users.
- **Open Graph (OG) Tags in SPAs**: Avoid hardcoding landing-page specific OG/Twitter tags in the generic SPA fallback `index.html`. Otherwise, deep links shared in chat apps will incorrectly unfurl as the homepage. 
- **LLM Context Files**: Implement emerging standards like `llms.txt` and `llms-full.txt` at the root path to provide AI systems with structured product information, use cases, and technical details.
- **Semantic HTML & JSON-LD**: Use tags like `<article>`, `<details>` and embed JSON-LD schemas (`WebApplication`, `FAQPage`) to ensure crawlers can confidently interpret page structure and FAQs.

### 6. Tooling
- **Package Manager**: Use **Bun** for all package operations (`bun install`, `bun add`, `bun run`).
- **Runtime**: Use Bun as the runtime environment.

