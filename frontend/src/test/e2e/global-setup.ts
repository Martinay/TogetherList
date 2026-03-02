import { type ChildProcess, spawn } from 'child_process'
import { resolve } from 'path'

const DEV_SERVER_URL = 'http://localhost:5173'
const BACKEND_URL = 'http://localhost:8080/health'
const MAX_WAIT_MS = 15_000
const POLL_INTERVAL_MS = 500

let devServerProcess: ChildProcess | undefined
let backendProcess: ChildProcess | undefined
let backendWasAlreadyRunning = false

/**
 * Wait until a server responds to HTTP requests.
 */
async function waitForServer(url: string, label: string): Promise<void> {
    const start = Date.now()
    while (Date.now() - start < MAX_WAIT_MS) {
        try {
            const response = await fetch(url)
            if (response.ok) return
        } catch {
            // Server not ready yet — retry
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
    throw new Error(`${label} at ${url} did not start within ${MAX_WAIT_MS}ms`)
}

/**
 * Check if the backend server is already running.
 */
async function isBackendRunning(): Promise<boolean> {
    try {
        const response = await fetch(BACKEND_URL)
        return response.ok
    } catch {
        return false
    }
}

/**
 * Vitest globalSetup — starts the Go backend and Vite dev server before all E2E tests.
 */
export async function setup(): Promise<void> {
    // Start Go backend if not already running
    backendWasAlreadyRunning = await isBackendRunning()

    if (!backendWasAlreadyRunning) {
        const frontendDir = new URL('../../..', import.meta.url).pathname
        const backendDir = resolve(frontendDir, '..', 'backend')

        backendProcess = spawn('go', ['run', './cmd/server/...'], {
            cwd: backendDir,
            stdio: 'pipe',
            env: { ...process.env },
        })

        backendProcess.stderr?.on('data', (data: Buffer) => {
            process.stderr.write(`[backend] ${data.toString()}`)
        })

        await waitForServer(BACKEND_URL, 'Go backend')
        console.log('✓ Go backend started')
    } else {
        console.log('✓ Go backend already running')
    }

    // Start Vite dev server
    const frontendDir = new URL('../../..', import.meta.url).pathname
    devServerProcess = spawn('bun', ['run', 'dev'], {
        cwd: frontendDir,
        stdio: 'pipe',
        env: { ...process.env },
    })

    devServerProcess.stderr?.on('data', (data: Buffer) => {
        process.stderr.write(`[dev-server] ${data.toString()}`)
    })

    await waitForServer(DEV_SERVER_URL, 'Dev server')
    console.log(`✓ Dev server ready at ${DEV_SERVER_URL}`)
}

/**
 * Vitest globalSetup teardown — stops the servers after all E2E tests.
 */
export async function teardown(): Promise<void> {
    if (devServerProcess) {
        devServerProcess.kill('SIGTERM')
        console.log('✓ Dev server stopped')
    }

    if (backendProcess && !backendWasAlreadyRunning) {
        backendProcess.kill('SIGTERM')
        console.log('✓ Go backend stopped')
    }
}
