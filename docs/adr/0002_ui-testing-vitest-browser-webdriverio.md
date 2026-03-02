---
status: Proposed
date: 2026-03-02
---

# AD: Adopt Vitest Browser Mode with WebdriverIO for UI Testing

## Context and Problem Statement

The frontend application currently uses **jsdom** as its test environment together with `@testing-library/react`. While jsdom is fast, it is a JavaScript re-implementation of the DOM that does not run a real browser engine. This means:

- CSS layout / visibility is not evaluated ‐ assertions like "element is visible" are unreliable.
- Browser APIs (e.g. `IntersectionObserver`, `ResizeObserver`, Web Animations) are missing or must be polyfilled.
- Event dispatching uses simulated `fireEvent` instead of real CDP / WebDriver events, so edge-cases in focus management, scrolling, and form behaviour may go undetected.

We need a testing strategy that runs React component tests inside a **real browser** while keeping the developer experience (speed, watch mode, Vite HMR) close to the existing unit-test setup.

## Decision Drivers

* **Accuracy** – tests should exercise real browser rendering and event handling.
* **Developer experience** – fast feedback loop, integrated with existing Vitest tooling.
* **CI compatibility** – must run headlessly on GitHub Actions (ubuntu-latest).
* **Maintenance** – minimal additional tooling and configuration.
* **User requirement** – the user explicitly requested `vitest` + `@vitest/browser-webdriverio`.

## Considered Options

1. Keep jsdom (status quo)
2. Vitest Browser Mode with **Playwright** provider (`@vitest/browser-playwright`)
3. Vitest Browser Mode with **WebdriverIO** provider (`@vitest/browser-webdriverio`)

### Cost Evaluation Per Option

#### Option 1: Keep jsdom (status quo)

**Building (Development)**:
- Authoring: Low — existing setup, no changes needed.
- Project Scale: Scales well; jsdom is fast.
- Onboarding: Low — developers already familiar.
- AI Assistance: Good tooling and documentation.

**Running (Operations)**:
- Runtime: Very fast (no browser startup).
- Deployment: No extra CI dependencies.
- Maintenance & Debugging: Higher long-term cost — bugs slip through because DOM simulation misses real-browser behaviour. Tests may pass locally but fail for real users.

**Externalities**:
- Interoperability: Cannot test browser-specific APIs.
- Security: N/A.

#### Option 2: Vitest Browser Mode with Playwright

**Building (Development)**:
- Authoring: Moderate — Vitest documentation recommends Playwright for new projects; first-class support. Supports parallel execution.
- Project Scale: Good performance; Playwright downloads its own browser binaries.
- Onboarding: Low-moderate — well-documented but different provider from user's request.
- AI Assistance: Excellent — very popular library.

**Running (Operations)**:
- Runtime: Fast; uses CDP directly, supports parallelism.
- Deployment: Requires `npx playwright install` in CI to download browsers (~200 MB).
- Maintenance & Debugging: Good trace and screenshot support built-in.

**Externalities**:
- Interoperability: Playwright-specific API, not W3C-standard WebDriver.
- Security: Maintained by Microsoft; well-audited.

#### Option 3: Vitest Browser Mode with WebdriverIO (Chosen)

**Building (Development)**:
- Authoring: Moderate — WebdriverIO uses W3C WebDriver protocol; well-documented. Vitest provides `@vitest/browser-webdriverio` as a first-class provider.
- Project Scale: Adequate for component-level UI tests; browser startup adds ~1-2s overhead per suite.
- Onboarding: Low — uses Chrome, which is already available on CI runners and developer machines.
- AI Assistance: Good; WebdriverIO is a mature, widely-known framework.

**Running (Operations)**:
- Runtime: Slightly slower than Playwright (no parallel execution within one provider instance), but acceptable for component tests.
- Deployment: Uses locally installed Chrome — no separate browser download step in CI.
- Maintenance & Debugging: WebdriverIO provides screenshots and logs.

**Externalities**:
- Interoperability: W3C WebDriver standard — industry standard automation protocol.
- Security: Mature open-source project.

## Decision Outcome

**Selected: Option 3 – WebdriverIO for E2E Testing (direct usage, not Vitest browser mode)**

Rationale:
- Explicitly requested by the user.
- W3C WebDriver is an industry-standard protocol, ensuring broad compatibility.
- Does not require a separate browser download step in CI (uses the Chrome already present on runners).
- WebdriverIO is used directly (via `remote()`) in Vitest tests running in Bun, with a `globalSetup` that auto-starts/stops the Vite dev server. This gives true E2E testing against the real running application.
- Vitest browser mode (`@vitest/browser-webdriverio`) was initially considered but lacks `page.goto()` — it's designed for component testing, not E2E.

The existing unit tests (jsdom-based) remain separate in `vite.config.ts`. E2E tests use a dedicated `vitest.e2e.config.ts` and live in `src/test/e2e/`.

## Consequences

* Good, because tests run against the real application in a real browser, catching CSS, layout, routing, and API issues early.
* Good, because developer experience is simple: `bun run test:e2e` auto-starts the dev server, runs tests, and stops the server.
* Good, because W3C WebDriver standard ensures long-term interoperability.
* Good, because the same `bun run test:e2e:run` command works locally and in CI.
* Bad, because E2E tests are slower than unit tests (~2-3s for browser startup + server start).
* Bad, because CI needs a Chrome installation and matching chromedriver (already present on `ubuntu-latest` runners).

## More Information

- [Vitest Browser Mode documentation](https://vitest.dev/guide/browser/)
- [WebdriverIO provider configuration](https://vitest.dev/config/browser/webdriverio)
- [`vitest-browser-react`](https://github.com/vitest-dev/vitest-browser-react) for React component rendering
