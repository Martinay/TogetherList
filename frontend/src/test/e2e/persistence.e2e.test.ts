import { it, expect } from 'vitest'
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { resolve } from 'node:path'
import { once } from 'node:events'
import { closeBrowser, createBrowser } from './browser-helper'
import { add } from './fixtures'
import type { ListState } from '../../features/view-list/types'
import { ready } from './global-setup'

it('reconstructs all list and item fields from JSONL after restarting the Go process', async () => {
    const url = 'http://localhost:18089'
    const data = await mkdtemp(resolve('e2e-artifacts/restart-data-'))
    let server: ChildProcess | undefined
    function start() {
        server = spawn(resolve('e2e-artifacts/server'), [], { env: { ...process.env, PORT: '18089', DATA_DIR: data, STATIC_DIR: resolve('dist') }, stdio: ['ignore', 'pipe', 'pipe'] })
        const log = createWriteStream('e2e-artifacts/restart-server.log', { flags: 'a' })
        server.stdout?.pipe(log); server.stderr?.pipe(log)
    }
    async function stop() {
        if (server?.pid && server.exitCode === null) {
            const exited = once(server, 'exit')
            server.kill('SIGTERM'); await exited
        }
    }
    const browser = await createBrowser()
    try {
        start(); await ready(`${url}/health`)
        const created = await fetch(`${url}/api/v1/list/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Disk-backed', creator: 'Alex', participants: ['Sam'] }) })
        expect(created.status).toBe(201)
        const { listId } = await created.json() as { listId: string }
        await browser.url(`${url}/list/${listId}`)
        await browser.$('button=Alex').waitForClickable(); await browser.$('button=Alex').click()
        await add(browser, 'Persisted item')
        await browser.waitUntil(async () => Object.keys((await (await fetch(`${url}/api/v1/list/${listId}`)).json() as ListState).items).length === 1)
        const original = await (await fetch(`${url}/api/v1/list/${listId}`)).json() as ListState
        const itemId = Object.keys(original.items)[0]!
        for (const [path, body] of [
            ['name', { name: 'Restarted list', renamedBy: 'Sam' }],
            [`items/${itemId}/title`, { newTitle: 'Restored title' }],
            [`items/${itemId}/description`, { description: 'Durable description' }],
            [`items/${itemId}/assigned-to`, { assignedTo: ['Alex', 'Sam'] }],
            [`items/${itemId}/completed`, { isCompleted: true, completedBy: 'Sam' }],
        ] as const) {
            expect((await fetch(`${url}/api/v1/list/${listId}/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status).toBe(200)
        }
        const before = await (await fetch(`${url}/api/v1/list/${listId}`)).json()
        await stop(); start(); await ready(`${url}/health`)
        expect(await (await fetch(`${url}/api/v1/list/${listId}`)).json()).toEqual(before)
        // A fresh browser has no cached state and must read the restarted service.
        const fresh = await createBrowser()
        try {
            await fresh.url(`${url}/list/${listId}`)
            await fresh.$('button=Sam').waitForClickable(); await fresh.$('button=Sam').click()
            await fresh.$('span=Restored title').waitForDisplayed()
            expect(await fresh.$('[data-testid="list-title"]').getText()).toBe('Restarted list')
            expect(await fresh.$('body').getText()).toContain('Durable description')
            expect(await fresh.$('body').getText()).toContain('Assigned to: Alex, Sam')
            expect(await fresh.$('button[aria-label="Mark incomplete"]').isDisplayed()).toBe(true)
        } finally { await closeBrowser(fresh) }
    } finally { await closeBrowser(browser); await stop() }
})
