import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { beforeEach, expect, it, vi } from 'vitest'
type Handler = (event: { request?: { url: string; method: string; mode?: string }; waitUntil: (promise: Promise<unknown>) => void; respondWith: (promise: Promise<unknown>) => void }) => void
let handlers: Record<string, Handler>, cache: { addAll: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn>; match: ReturnType<typeof vi.fn> }, network: ReturnType<typeof vi.fn>
beforeEach(() => {
    handlers = {}; cache = { addAll: vi.fn(), put: vi.fn(), match: vi.fn() }; network = vi.fn()
    runInNewContext(readFileSync('src/features/offline/service-worker.js', 'utf8'), {
        self: { location: { origin: 'https://lists.test' }, clients: { claim: vi.fn() }, addEventListener: (name: string, handler: Handler) => { handlers[name] = handler } },
        caches: { open: vi.fn().mockResolvedValue(cache) }, fetch: network, URL,
    })
})
async function request(path: string, mode?: string) {
    let result: Promise<unknown> | undefined
    handlers.fetch!({ request: { url: `https://lists.test${path}`, method: 'GET', mode }, waitUntil: () => {}, respondWith: promise => { result = promise } })
    return result
}
it('installs the complete build manifest and rejects failed manifests', async () => {
    const paths = ['/index.html', '/assets/app.js', '/assets/app.css', '/locales/de/translation.json']
    network.mockResolvedValue({ ok: true, json: async () => paths })
    let pending: Promise<unknown> | undefined
    handlers.install!({ waitUntil: promise => { pending = promise }, respondWith: () => {} })
    await pending
    expect(cache.addAll).toHaveBeenCalledWith(paths)
    network.mockResolvedValue({ ok: false })
    handlers.install!({ waitUntil: promise => { pending = promise }, respondWith: () => {} })
    await expect(pending).rejects.toThrow('manifest')
})
it('leaves API requests completely outside the worker cache', async () => {
    expect(await request('/api/v1/list/example')).toBeUndefined()
    expect(network).not.toHaveBeenCalled(); expect(cache.put).not.toHaveBeenCalled()
})
it('never caches HTTP failures for navigation or static files', async () => {
    const failed = { ok: false, status: 503 }
    network.mockResolvedValue(failed)
    expect(await request('/list/example', 'navigate')).toBe(failed)
    expect(await request('/locales/en/translation.json')).toBe(failed)
    expect(cache.put).not.toHaveBeenCalled()
})
it('falls back to the cached shell for offline deep links and static assets', async () => {
    network.mockRejectedValue(new TypeError('offline')); cache.match.mockResolvedValue('cached')
    expect(await request('/list/example', 'navigate')).toBe('cached')
    expect(cache.match).toHaveBeenCalledWith('/index.html')
    expect(await request('/assets/app.js')).toBe('cached')
})
it('stores only successful same-origin shell responses', async () => {
    const clone = {}
    const good = { ok: true, type: 'basic', clone: () => clone }
    network.mockResolvedValue(good)
    expect(await request('/list/example', 'navigate')).toBe(good)
    expect(cache.put).toHaveBeenCalledWith('/index.html', clone)
})
