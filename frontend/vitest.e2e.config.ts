import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/test/e2e/**/*.e2e.test.ts', 'src/test/e2e/offline.production.test.ts'],
        testTimeout: 60_000,
        hookTimeout: 60_000,
        fileParallelism: false,
        maxWorkers: 1,
        setupFiles: ['./src/test/e2e/artifacts.ts'],
        reporters: ['default', 'junit'],
        outputFile: { junit: 'e2e-artifacts/results.xml' },
        globalSetup: './src/test/e2e/global-setup.ts',
    },
})
