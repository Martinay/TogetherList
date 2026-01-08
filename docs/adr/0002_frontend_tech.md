---
status: Accepted
date: 2026-01-09
---

# AD: Use React + Vite for Frontend

## Context and Problem Statement

TogetherList requires a frontend technology stack that supports:
- Real-time updates via polling (event sourcing hydration)
- Premium "Vibe Coding" aesthetics with smooth animations
- Strict performance budgets (LCP < 2.5s, FCP < 1.8s, Bundle ≤ 200KB)
- Multi-language support (i18n)
- Rapid development iteration with AI assistance

The decision impacts development velocity, user experience, and long-term maintainability.

## Decision Drivers

* **Performance Budgets**: Bundle size must stay ≤ 200KB compressed
* **Vibe Coding Compatibility**: Must enable premium aesthetics with minimal friction
* **Event Sourcing Alignment**: UI should naturally derive state from event streams
* **AI-Assisted Development**: Patterns must be well-understood by AI tools
* **Real-time Updates**: Must support efficient polling and state reconciliation
* **Simplicity**: Avoid over-engineering for a micro-SaaS product

## Considered Options

1. Vanilla JS + CSS
2. React + Vite
3. Next.js (App Router)

### Cost Evaluation Per Option

#### Option 1: Vanilla JS + CSS

**Building (Development)**:
- Authoring: Manual DOM manipulation, no component model
- Project Scale: Difficult to maintain as complexity grows
- Onboarding: Simple concepts but inconsistent patterns
- AI Assistance: Less structured, harder for AI to assist

**Running (Operations)**:
- Runtime: Excellent - minimal overhead
- Deployment: Simple static hosting
- Maintenance & Debugging: Harder without dev tools ecosystem

**Externalities**:
- Interoperability: Limited ecosystem
- Security: Manual XSS prevention

#### Option 2: React + Vite

**Building (Development)**:
- Authoring: Component-based, excellent DX with hot reload
- Project Scale: Well-suited for small to medium apps
- Onboarding: Widely known, abundant resources
- AI Assistance: Excellent - most common patterns in training data

**Running (Operations)**:
- Runtime: Good - virtual DOM adds ~40KB but enables efficient updates
- Deployment: Simple static hosting (Vite builds to dist/)
- Maintenance & Debugging: Excellent React DevTools

**Externalities**:
- Interoperability: Massive ecosystem (animation, i18n, testing)
- Security: Built-in XSS prevention via JSX

#### Option 3: Next.js (App Router)

**Building (Development)**:
- Authoring: Full-stack React with server components
- Project Scale: Overkill for client-only micro-SaaS
- Onboarding: Steeper learning curve with App Router
- AI Assistance: Good but newer patterns less established

**Running (Operations)**:
- Runtime: Heavier bundle, server-side complexity
- Deployment: Requires Node.js server or edge runtime
- Maintenance & Debugging: More complex infrastructure

**Externalities**:
- Interoperability: Same React ecosystem
- Security: Additional server-side considerations

## Decision Outcome

**Selected: React + Vite**

React + Vite provides the optimal balance for TogetherList:

1. **Bundle Size**: Vite's tree-shaking keeps the bundle within the 200KB budget (~150-180KB with dependencies).

2. **Vibe Coding Alignment**: React's component model enables rapid iteration on UI aesthetics. Libraries like Framer Motion integrate seamlessly for premium animations.

3. **Event Sourcing Fit**: React's unidirectional data flow maps naturally to event sourcing. State can be derived by replaying events, and React efficiently updates the UI.

4. **AI-Friendly**: React is the most widely understood framework, enabling faster "vibe coding" iterations with AI assistance.

5. **Right-Sized Complexity**: Next.js adds SSR/SSG overhead we don't need. Vanilla JS lacks productivity benefits.

## Consequences

* Good, because fast development with Vite's hot module replacement
* Good, because rich animation ecosystem (Framer Motion, React Spring)
* Good, because excellent testing with Vitest + React Testing Library
* Good, because easy i18n with react-i18next
* Bad, because adds ~150KB to bundle (acceptable within budget)
* Bad, because requires React knowledge (widely available)

## Testing Strategy

| Type | Tool | Purpose |
|------|------|---------|
| Unit | Vitest | Component logic, event handlers |
| Integration | React Testing Library | User interactions, state flows |
| E2E | Playwright | Full user journey validation |

## More Information

- Performance budgets defined in: `docs/skills/frontend.md`
- Project vision: `docs/vision.md`
- Related decision: Backend Tech (pending in `docs/adr/0003_backend_tech.md`)
