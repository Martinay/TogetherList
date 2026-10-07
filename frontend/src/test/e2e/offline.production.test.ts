import { beforeAll, afterAll, beforeEach, expect, it } from 'vitest'
import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { remote, type Browser } from 'webdriverio'

const url = 'http://localhost:18087'
let server: ChildProcess, driver: ChildProcess, browser: Browser, data: string
async function ready(endpoint: string) {
    for (let i = 0; i < 100; i++) {
        try { if ((await fetch(endpoint)).ok) return } catch { /* Startup. */ }
        await new Promise(resolve => setTimeout(resolve, 200))
    }
    throw new Error(`Server unavailable: ${endpoint}`)
}
async function cdp(cmd: string, params: Record<string, unknown>) {
    const response = await fetch(`http://localhost:19517/session/${browser.sessionId}/goog/cdp/execute`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cmd, params }) })
    if (!response.ok) throw new Error(await response.text())
}
beforeAll(async () => {
    await mkdir('.cache', { recursive: true })
    data = await mkdtemp(resolve('.cache/offline-data-'))
    execFileSync(process.env.GO_BINARY || 'go', ['build', '-o', resolve('.cache/offline-server'), './cmd/server'], { cwd: resolve('../backend'), env: process.env })
    server = spawn(resolve('.cache/offline-server'), [], {
        cwd: resolve('../backend'), env: { ...process.env, PORT: '18087', DATA_DIR: data, STATIC_DIR: resolve('dist') }, stdio: 'inherit',
    })
    driver = spawn(process.env.CHROMEDRIVER_BINARY || 'chromedriver', ['--port=19517'], { stdio: 'ignore' })
    await ready(`${url}/health`)
    await ready('http://localhost:19517/status')
    browser = await remote({ hostname: 'localhost', port: 19517, logLevel: 'error', capabilities: {
        browserName: 'chrome', 'goog:chromeOptions': {
            ...(process.env.CHROME_BINARY ? { binary: process.env.CHROME_BINARY } : {}),
            args: ['--headless', '--no-sandbox', '--disable-gpu'],
        },
    } })
})
beforeEach(async () => {
    await cdp('Network.enable', {})
    await cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
})
afterAll(async () => {
    if (browser) await browser.deleteSession()
    server?.kill('SIGTERM'); driver?.kill('SIGTERM')
    if (data) await rm(data, { recursive: true, force: true })
})
it('reloads the production shell and durable edits offline, then automatically replays exactly once', async () => {
    const created = await fetch(`${url}/api/v1/list/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Offline groceries', creator: 'Alex', participants: ['Alex'] }) })
    const { listId } = await created.json() as { listId: string }
    await browser.url(`${url}/list/${listId}`)
    await browser.execute((id: string) => { localStorage.setItem(`list:${id}:username`, 'Alex'); localStorage.setItem('i18nextLng', 'en') }, listId)
    await browser.refresh()
    await browser.$('[data-testid="list-title"]').waitForDisplayed({ timeout: 10000 }).catch(async error => { console.log('Browser body:', await browser.$('body').getText()); console.log('Logs:', await browser.getLogs('browser')); throw error })
    await browser.waitUntil(async () => browser.execute(() => !!navigator.serviceWorker.controller), { timeout: 15000 })
    await cdp('Network.enable', {})
    await cdp('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
    await browser.waitUntil(async () => (await browser.$('[role="status"]').getText()).includes('Offline'))
    const input = await browser.$('input[placeholder="What needs to be done?"]')
    await input.setValue('Milk offline')
    await browser.$('button=Add').click()
    await browser.waitUntil(async () => (await browser.$('body').getText()).includes('Milk offline'))
    await browser.$('[data-testid="edit-list-name"]').click()
    await browser.$('[data-testid="edit-list-input"]').setValue('Offline shopping')
    await browser.keys('Enter')
    await browser.waitUntil(async () => (await browser.$('[data-testid="list-title"]').getText()) === 'Offline shopping')
    await browser.$('button[aria-label="Edit"]').waitForClickable()
    await browser.$('button[aria-label="Edit"]').click()
    await browser.$('input[type="text"]:not([placeholder])').waitForDisplayed()
    await browser.keys('Oat milk offline')
    await browser.keys('Enter')
    await browser.waitUntil(async () => !(await browser.$('input[type="text"]:not([placeholder])').isExisting()))
    await browser.$('button[aria-expanded]:not([aria-haspopup])').click()
    await browser.$('textarea').waitForDisplayed()
    await browser.$('textarea').setValue('Two cartons')
    await browser.$('input[type="checkbox"]').click()
    await browser.$('button[aria-label="Mark complete"]').click()
    await browser.waitUntil(async () => (await browser.$('[role="status"]').getText()).includes('Pending edits: 6'))
    await browser.refresh()
    await browser.$('[data-testid="list-title"]').waitForDisplayed()
    expect(await browser.$('body').getText()).toContain('Oat milk offline')
    expect(await browser.$('[role="status"]').getText()).toContain('Pending edits: 6')
    await cdp('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
    await browser.waitUntil(async () => {
        const state = await (await fetch(`${url}/api/v1/list/${listId}`)).json() as { items: Record<string, { title: string }> }
        return Object.values(state.items).filter(item => item.title === 'Oat milk offline').length === 1
    }, { timeout: 15000 })
    await browser.waitUntil(async () => !(await browser.$('[role="status"]').isExisting()), { timeout: 15000 })
    await browser.refresh()
    await browser.waitUntil(async () => (await browser.$('body').getText()).includes('Oat milk offline'))
    expect(await browser.$('body').getText()).toContain('Oat milk offline')
    const state = await (await fetch(`${url}/api/v1/list/${listId}`)).json() as { items: Record<string, unknown> }
    expect(Object.keys(state.items)).toHaveLength(1)
    expect(Object.values(state.items)[0]).toMatchObject({ title: 'Oat milk offline', description: 'Two cartons', completed: true, assigned_to: ['Alex'] })
})

it('keeps cross-tab edits durable during a delayed acknowledgement and coalesces replay', async () => {
    const created = await fetch(`${url}/api/v1/list/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Cross-tab', creator: 'Alex', participants: ['Alex'] }) })
    const { listId } = await created.json() as { listId: string }
    await browser.url(`${url}/list/${listId}`)
    await browser.execute((id: string) => localStorage.setItem(`list:${id}:username`, 'Alex'), listId)
    await browser.refresh()
    await browser.$('[data-testid="list-title"]').waitForDisplayed()
    const firstTab = await browser.getWindowHandle()
    await browser.execute(() => {
        const original = window.fetch.bind(window)
        const control = window as unknown as { releaseReplay: () => void; replayRequests: number }
        control.replayRequests = 0
        let delay = true
        window.fetch = async (input, options) => {
            if (options?.method === 'POST' && delay) {
                delay = false
                control.replayRequests++
                await new Promise<void>(resolve => { control.releaseReplay = resolve })
            }
            return original(input, options)
        }
    })
    await browser.$('input[placeholder="What needs to be done?"]').setValue('First tab item')
    await browser.$('button=Add').click()
    await browser.waitUntil(async () => browser.execute(() => typeof (window as unknown as { releaseReplay?: unknown }).releaseReplay === 'function')).catch(async error => { console.log('Cross-tab debug', await browser.$('body').getText(), await browser.execute(() => ({ online: navigator.onLine, store: { ...localStorage } }))); throw error })
    await browser.newWindow(`${url}/list/${listId}`)
    const secondTab = await browser.getWindowHandle()
    await browser.$('[data-testid="list-title"]').waitForDisplayed()
    await browser.execute(() => {
        const original = window.fetch.bind(window)
        const control = window as unknown as { mutationRequests: number }
        control.mutationRequests = 0
        window.fetch = (input, options) => {
            if (options?.method) control.mutationRequests++
            return original(input, options)
        }
    })
    await browser.$('input[placeholder="What needs to be done?"]').setValue('Second tab item')
    await browser.$('button=Add').click()
    await browser.waitUntil(async () => (await browser.$('body').getText()).includes('Second tab item'), { timeout: 2000 })
    expect(await browser.execute((id: string) => JSON.parse(localStorage.getItem(`togetherlist:offline:v1:${id}`)!).queue.length, listId)).toBe(2)
    // Let both polling timers run while the first tab owns replay.
    await browser.pause(3500)
    expect(await browser.execute(() => (window as unknown as { mutationRequests: number }).mutationRequests)).toBe(0)
    await browser.switchToWindow(firstTab)
    expect(await browser.execute(() => (window as unknown as { replayRequests: number }).replayRequests)).toBe(1)
    await browser.execute(() => (window as unknown as { releaseReplay: () => void }).releaseReplay())
    await browser.waitUntil(async () => {
        const state = await (await fetch(`${url}/api/v1/list/${listId}`)).json() as { items: Record<string, unknown> }
        return Object.keys(state.items).length === 2
    }, { timeout: 15000 })
    await browser.waitUntil(async () => browser.execute((id: string) => JSON.parse(localStorage.getItem(`togetherlist:offline:v1:${id}`)!).queue.length === 0, listId), { timeout: 15000 })
    const state = await (await fetch(`${url}/api/v1/list/${listId}`)).json() as { items: Record<string, { title: string }> }
    expect(Object.values(state.items).map(item => item.title).sort()).toEqual(['First tab item', 'Second tab item'])
    await browser.switchToWindow(secondTab)
    await browser.closeWindow()
    await browser.switchToWindow(firstTab)
})
