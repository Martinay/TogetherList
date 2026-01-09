---
status: Proposed
date: 2026-01-09
---

# AD: Use Bun as Package Manager and Runtime

## Context and Problem Statement

The frontend development requires a package manager and JavaScript runtime for:
- Installing and managing npm dependencies
- Running development servers (Vite)
- Executing build scripts and tests

The default Node.js + npm is not available in the development environment. A decision is needed on which package manager/runtime to use.

## Decision Drivers

* **Environment Availability**: Runtime must be available on the development machine
* **Performance**: Faster installs and script execution improve DX
* **Compatibility**: Must work with existing React + Vite toolchain
* **Simplicity**: Single tool for multiple purposes preferred
* **npm Compatibility**: Must install packages from npm registry

## Considered Options

1. Node.js + npm
2. Node.js + pnpm
3. Bun

### Cost Evaluation Per Option

#### Option 1: Node.js + npm

**Building (Development)**:
- Authoring: Standard, widely documented
- Project Scale: Good, but slower install times
- Onboarding: Universal familiarity
- AI Assistance: Excellent - most common in training data

**Running (Operations)**:
- Runtime: Moderate - established but not optimized
- Deployment: Standard, well-supported
- Maintenance & Debugging: Excellent ecosystem maturity

**Externalities**:
- Interoperability: Universal compatibility
- Security: Mature audit tooling

#### Option 2: Node.js + pnpm

**Building (Development)**:
- Authoring: Similar to npm with stricter dependency handling
- Project Scale: Better for monorepos, disk-efficient
- Onboarding: Moderate - different from npm
- AI Assistance: Good but less common in examples

**Running (Operations)**:
- Runtime: Node.js performance
- Deployment: May require additional setup
- Maintenance & Debugging: Good, growing ecosystem

**Externalities**:
- Interoperability: npm-compatible
- Security: Same as npm

#### Option 3: Bun

**Building (Development)**:
- Authoring: Drop-in replacement for npm commands
- Project Scale: Excellent - very fast installs
- Onboarding: Simple - familiar npm-like commands
- AI Assistance: Growing support

**Running (Operations)**:
- Runtime: Excellent - native speed, fast startup
- Deployment: Single binary, easy to install
- Maintenance & Debugging: Maturing tooling, active development

**Externalities**:
- Interoperability: npm-compatible, runs most Node.js code
- Security: Newer ecosystem, less audit tooling

## Decision Outcome

**Selected: Bun**

Bun provides the optimal solution for TogetherList:

1. **Availability**: Bun is installed and available in the development environment.

2. **Performance**: Bun's install speeds are 10-30x faster than npm, improving iteration velocity.

3. **Compatibility**: Bun is fully compatible with npm packages and works seamlessly with Vite.

4. **Simplicity**: Bun serves as both package manager and runtime, reducing toolchain complexity.

5. **Modern DX**: Native TypeScript support without compilation step.

## Consequences

* Good, because significantly faster package installation
* Good, because single tool for package management and runtime
* Good, because native TypeScript support
* Good, because npm-compatible (uses npm registry)
* Bad, because newer ecosystem with less community content
* Bad, because some edge cases with Node.js compatibility

## More Information

- Bun documentation: https://bun.sh
- Related ADR: Frontend Tech (`docs/adr/0002_frontend_tech.md`)
- Usage: Replace `npm` commands with `bun` (e.g., `bun install`, `bun run dev`)
