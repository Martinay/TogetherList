import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/test/e2e/**/*.e2e.test.ts'],
        testTimeout: 30_000,
        hookTimeout: 30_000,
        globalSetup: './src/test/e2e/global-setup.ts',
    },
})
