import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import { mkdir, mkdtemp } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'
import { once } from 'node:events'

const processes: ChildProcess[] = []
let data: string
export async function ready(url: string) {
    for (let i = 0; i < 150; i++) {
        try { if ((await fetch(url)).ok) return } catch { /* Startup. */ }
        await new Promise(resolve => setTimeout(resolve, 200))
    }
    throw new Error(`Server unavailable: ${url}`)
}
async function requireFree(url: string) {
    try { await fetch(url) } catch { return }
    throw new Error(`E2E requires its own service; port already occupied: ${url}`)
}
export async function setup() {
    await mkdir('e2e-artifacts', { recursive: true })
    await requireFree('http://localhost:5173/health')
    await requireFree('http://localhost:19517/status')
    data = await mkdtemp(resolve('e2e-artifacts/data-'))
    try {
        execFileSync(process.env.GO_BINARY || 'go', ['build', '-o', resolve('e2e-artifacts/server'), './cmd/server'], { cwd: resolve('../backend'), env: process.env })
        const server = spawn(resolve('e2e-artifacts/server'), [], {
            env: { ...process.env, PORT: '5173', DATA_DIR: data, STATIC_DIR: resolve('dist') }, stdio: ['ignore', 'pipe', 'pipe'],
        })
        const driver = spawn(process.env.CHROMEDRIVER_BINARY || 'chromedriver', ['--port=19517'], { stdio: ['ignore', 'pipe', 'pipe'] })
        for (const [child, name] of [[server, 'server'], [driver, 'driver']] as const) {
            processes.push(child)
            const log = createWriteStream(`e2e-artifacts/${name}.log`)
            child.stdout?.pipe(log); child.stderr?.pipe(log)
            child.on('error', error => log.write(String(error)))
        }
        await ready('http://localhost:5173/health')
        await ready('http://localhost:19517/status')
    } catch (error) { await teardown(); throw error }
}
export async function teardown() {
    for (const child of processes) {
        if (child.exitCode === null && child.pid) {
            const exited = once(child, 'exit')
            child.kill('SIGTERM')
            await exited
        }
    }
    // Keep JSONL data with logs for failure diagnosis; the next run starts clean.
}
