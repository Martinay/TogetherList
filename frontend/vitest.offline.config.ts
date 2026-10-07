import { defineConfig } from 'vitest/config'
export default defineConfig({ test: {
    include: ['src/test/e2e/offline.production.test.ts'],
    testTimeout: 60000, hookTimeout: 60000,
} })
