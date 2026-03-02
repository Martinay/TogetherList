import { type ChildProcess, spawn } from 'child_process'

const DEV_SERVER_URL = 'http://localhost:5173'
const MAX_WAIT_MS = 15_000
const POLL_INTERVAL_MS = 500

let devServerProcess: ChildProcess | undefined

/**
 * Wait until the dev server responds to HTTP requests.
 */
async function waitForServer(): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < MAX_WAIT_MS) {
        try {
            const response = await fetch(DEV_SERVER_URL)
            if (response.ok) return
        } catch {
            // Server not ready yet — retry
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
    throw new Error(`Dev server at ${DEV_SERVER_URL} did not start within ${MAX_WAIT_MS}ms`)
}

/**
 * Vitest globalSetup — starts the Vite dev server before all E2E tests.
 */
export async function setup(): Promise<void> {
    const frontendDir = new URL('../../..', import.meta.url).pathname
    devServerProcess = spawn('bun', ['run', 'dev'], {
        cwd: frontendDir,
        stdio: 'pipe',
        env: { ...process.env },
    })

    // Forward stderr so dev server errors are visible
    devServerProcess.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(`[dev-server] ${data.toString()}`)
    })

    await waitForServer()
    console.log(`✓ Dev server ready at ${DEV_SERVER_URL}`)
}

/**
 * Vitest globalSetup teardown — stops the dev server after all E2E tests.
 */
export async function teardown(): Promise<void> {
    if (devServerProcess) {
        devServerProcess.kill('SIGTERM')
        console.log('✓ Dev server stopped')
    }
}
