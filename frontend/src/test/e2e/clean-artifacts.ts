import { mkdirSync, rmSync } from 'node:fs'
// JUnit opens its output before globalSetup; cleanup must precede Vitest startup.
rmSync('e2e-artifacts', { recursive: true, force: true })
mkdirSync('e2e-artifacts', { recursive: true })
