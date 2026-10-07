import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { cachedList, loadList, mutateList, replay, retryFailed, syncStatus } from '../features/offline/store'
const id = 'list-id'
const base = { name: 'Groceries', participants: ['Alex'], items: {} }
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })
beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn()); vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true) })
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
async function seed() { vi.mocked(fetch).mockResolvedValue(response(base)); await loadList(id) }
function offline() { vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false) }
describe('durable offline lists', () => {
    it('reads snapshots after reload without network and never caches failed API responses', async () => {
        await seed(); offline()
        expect(await loadList(id)).toEqual(base)
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
        vi.mocked(fetch).mockResolvedValue(response({ error: 'no' }, 503))
        expect(await loadList(id)).toEqual(base)
        await expect(loadList('uncached')).rejects.toThrow()
        expect(cachedList('uncached')).toBeNull()
    })
    it('persists every supported edit and identity through module reload', async () => {
        await seed(); offline()
        const item = await mutateList(`/list/${id}/items`, 'POST', { title: 'Milk', createdBy: 'Alex' })
        const path = `/list/${id}/items/${item.itemId}`
        await mutateList(`/list/${id}/name`, 'PUT', { name: 'Shopping' })
        await mutateList(`${path}/title`, 'PUT', { newTitle: 'Oat milk' })
        await mutateList(`${path}/description`, 'PUT', { description: 'Two' })
        await mutateList(`${path}/assigned-to`, 'PUT', { assignedTo: ['Alex'] })
        await mutateList(`${path}/completed`, 'PUT', { isCompleted: true, completedBy: 'Alex' })
        localStorage.setItem(`list:${id}:username`, 'Alex')
        vi.resetModules()
        const fresh = await import('../features/offline/store')
        const state = await fresh.loadList(id)
        expect(state.name).toBe('Shopping')
        expect(state.items[item.itemId]).toMatchObject({ title: 'Oat milk', description: 'Two', completed: true, assigned_to: ['Alex'] })
        expect(fresh.syncStatus().pending).toBe(6)
        expect(localStorage.getItem(`list:${id}:username`)).toBe('Alex')
    })
    it('replays in order and retries an ambiguous response with the same creation ID', async () => {
        await seed(); offline()
        const item = await mutateList(`/list/${id}/items`, 'POST', { title: 'Milk', createdBy: 'Alex' })
        await mutateList(`/list/${id}/items/${item.itemId}/title`, 'PUT', { newTitle: 'Oat milk' })
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
        vi.mocked(fetch).mockImplementation(async (_url, options) => { if (options?.method) throw new TypeError('connection lost'); return response(base) })
        await replay()
        expect(syncStatus().pending).toBe(2)
        const first = vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method).at(-1)![1]
        let title = 'Milk'
        vi.mocked(fetch).mockImplementation(async (_url, options) => {
            if (options?.method === 'PUT') title = 'Oat milk'
            return options?.method ? response({}) : response({ ...base, items: { [item.itemId]: { ...cachedList(id)!.items[item.itemId], title } } })
        })
        await retryFailed()
        const calls = vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method)
        expect(calls[0]![1]?.headers).toEqual(first?.headers)
        expect(calls[1]![1]?.headers).toEqual(first?.headers)
        expect(calls[2]![0]).toContain('/title')
        expect(syncStatus().pending).toBe(0)
        expect(cachedList(id)!.items[item.itemId]!.title).toBe('Oat milk')
    })
    it('retains permanent errors and later operations until explicit retry', async () => {
        await seed(); offline()
        await mutateList(`/list/${id}/name`, 'PUT', { name: 'New' })
        await mutateList(`/list/${id}/name`, 'PUT', { name: 'Latest' })
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
        vi.mocked(fetch).mockResolvedValue(response({}, 409))
        await replay(); const count = vi.mocked(fetch).mock.calls.length
        await replay()
        expect(vi.mocked(fetch).mock.calls.length).toBe(count)
        expect(syncStatus()).toMatchObject({ failed: true, pending: 2 })
        expect(cachedList(id)!.name).toBe('Latest')
        let name = 'Remote'
        vi.mocked(fetch).mockImplementation(async (_url, options) => {
            if (options?.method) { name = JSON.parse(String(options.body)).name; return response({}) }
            return response({ ...base, name })
        })
        await retryFailed()
        expect(syncStatus().pending).toBe(0)
    })
    it('blocks same-field remote conflicts without sending or discarding pending edits', async () => {
        await seed(); offline(); await mutateList(`/list/${id}/name`, 'PUT', { name: 'Local' })
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
        vi.mocked(fetch).mockResolvedValue(response({ ...base, name: 'Other user', revision: 'remote' }))
        await replay()
        expect(syncStatus()).toMatchObject({ failed: true, pending: 1 })
        expect(cachedList(id)!.name).toBe('Local')
        expect(vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method)).toHaveLength(0)
    })
    it('preserves queued edits when polling returns stale state', async () => {
        await seed(); offline()
        await mutateList(`/list/${id}/name`, 'PUT', { name: 'Local' })
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
        expect((await loadList(id)).name).toBe('Local')
        expect(cachedList(id)!.name).toBe('Local')
    })
    it('does not accept edits when durable storage fails', async () => {
        await seed(); offline()
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
        await expect(mutateList(`/list/${id}/name`, 'PUT', { name: 'Lost' })).rejects.toThrow()
        expect(cachedList(id)!.name).toBe('Groceries')
    })
    it.each([408, 429, 500, 503])('keeps retryable HTTP %s errors queued', async status => {
        await seed(); offline(); await mutateList(`/list/${id}/name`, 'PUT', { name: 'Local' })
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
        vi.mocked(fetch).mockResolvedValue(response({}, status)); await replay()
        expect(syncStatus()).toMatchObject({ failed: false, pending: 1 })
    })
})

it('never persists a malformed successful API response', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ error: 'not a list' }))
    await expect(loadList('new')).rejects.toThrow('Invalid list response')
    expect(cachedList('new')).toBeNull()
})

it('an in-flight stale poll cannot race a newly queued edit', async () => {
    await seed()
    let resolvePoll!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { resolvePoll = resolve }))
    const polling = loadList(id)
    await vi.waitFor(() => expect(resolvePoll).toBeTypeOf('function'))
    offline()
    const editing = mutateList(`/list/${id}/name`, 'PUT', { name: 'Local wins projection' })
    resolvePoll(response(base))
    await polling; await editing
    expect(cachedList(id)!.name).toBe('Local wins projection')
    expect(syncStatus().pending).toBe(1)
})

it('coalesces hanging replay and permits prompt durable enqueue in another tab, retaining it after ack', async () => {
    await seed(); offline()
    const item = await mutateList(`/list/${id}/items`, 'POST', { title: 'First', createdBy: 'Alex' })
    vi.resetModules()
    const otherTab = await import('../features/offline/store')
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    let finish!: (value: Response) => void
    const remote = { ...base, items: { [item.itemId]: cachedList(id)!.items[item.itemId] } }
    vi.mocked(fetch).mockImplementation(async (_url, options) => {
        if (options?.method === 'POST') return new Promise(resolve => { finish = resolve })
        if (options?.method) return response({})
        return response(remote)
    })
    const firstReplay = replay()
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    const repeats = Array.from({ length: 20 }, () => replay())
    await otherTab.replay() // Another tab skips the occupied replay lock.
    expect(vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method)).toHaveLength(1)
    await otherTab.mutateList(`/list/${id}/name`, 'PUT', { name: 'Concurrent edit' })
    expect(otherTab.syncStatus().pending).toBe(2)
    expect(otherTab.cachedList(id)!.name).toBe('Concurrent edit')
    offline(); finish(response({}))
    await Promise.all([firstReplay, ...repeats])
    expect(syncStatus().pending).toBe(1)
    expect(cachedList(id)!.name).toBe('Concurrent edit')
})

it('does not regress an acknowledged edit when an older refresh returns', async () => {
    await seed()
    let finish!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const poll = loadList(id)
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    offline(); await mutateList(`/list/${id}/name`, 'PUT', { name: 'Acknowledged' })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    let name = base.name
    vi.mocked(fetch).mockImplementation(async (_url, options) => {
        if (options?.method) { name = JSON.parse(String(options.body)).name; return response({}) }
        return response({ ...base, name })
    })
    await replay()
    finish(response(base)); await poll
    expect(cachedList(id)!.name).toBe('Acknowledged')
    expect(syncStatus().pending).toBe(0)
})

it('discards a rejected creation and its dependent edits while syncing later valid operations', async () => {
    const { discardFailed, failedEdits } = await import('../features/offline/store')
    await seed(); offline()
    const item = await mutateList(`/list/${id}/items`, 'POST', { title: '', createdBy: 'Alex' })
    await mutateList(`/list/${id}/items/${item.itemId}/title`, 'PUT', { newTitle: 'Dependent' })
    await mutateList(`/list/${id}/name`, 'PUT', { name: 'Valid later edit' })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    vi.mocked(fetch).mockImplementation(async (_url, options) => options?.method ? new Response('Title is required', { status: 400 }) : response(base))
    await replay()
    expect(failedEdits()[0]).toMatchObject({ status: 400, detail: 'Title is required', method: 'POST' })
    const count = vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method).length
    await retryFailed()
    expect(vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method)).toHaveLength(count)
    let name = base.name
    vi.mocked(fetch).mockImplementation(async (_url, options) => {
        if (options?.method) { name = JSON.parse(String(options.body)).name; return response({}) }
        return response({ ...base, name })
    })
    await discardFailed(id, item.itemId)
    expect(syncStatus().pending).toBe(0)
    expect(cachedList(id)!.items[item.itemId]).toBeUndefined()
    expect(cachedList(id)!.name).toBe('Valid later edit')
    offline()
    const corrected = await mutateList(`/list/${id}/items`, 'POST', { title: 'Corrected', createdBy: 'Alex' })
    expect(corrected.itemId).not.toBe(item.itemId)
})

it('explicitly rejects unsupported editing without modifying storage, while online reads work', async () => {
    const { supportsOfflineEdits } = await import('../features/offline/store')
    await seed()
    const before = localStorage.getItem(`togetherlist:offline:v1:${id}`)
    const locks = navigator.locks
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined })
    try {
        expect(supportsOfflineEdits()).toBe(false)
        await expect(mutateList(`/list/${id}/name`, 'PUT', { name: 'Unsafe' })).rejects.toThrow('Web Locks')
        expect(await loadList(id)).toEqual(base)
        expect(localStorage.getItem(`togetherlist:offline:v1:${id}`)).toBe(before)
        await replay()
    } finally { Object.defineProperty(navigator, 'locks', { configurable: true, value: locks }) }
})

it('does not fetch idle cached lists during replay', async () => {
    await seed()
    vi.mocked(fetch).mockImplementation(async () => response(base))
    await loadList('idle-list')
    offline(); await mutateList(`/list/${id}/items`, 'POST', { title: 'Queued', createdBy: 'Alex' })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    vi.mocked(fetch).mockClear()
    vi.mocked(fetch).mockImplementation(async () => response(base))
    await replay()
    expect(vi.mocked(fetch).mock.calls.every(([url]) => !String(url).includes('idle-list'))).toBe(true)
    vi.mocked(fetch).mockClear()
    await Promise.all([replay(), replay(), replay()])
    expect(fetch).not.toHaveBeenCalled()
})

it('durably discards a rejection while another list has a hanging request', async () => {
    const { discardFailed } = await import('../features/offline/store')
    await seed()
    vi.mocked(fetch).mockImplementation(async () => response(base))
    await loadList('other-list')
    offline()
    const failed = await mutateList(`/list/${id}/items`, 'POST', { title: '', createdBy: 'Alex' })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    vi.mocked(fetch).mockImplementation(async (_url, options) => options?.method ? new Response('Title is required', { status: 400 }) : response(base))
    await replay()
    offline()
    await mutateList('/list/other-list/items', 'POST', { title: 'Good', createdBy: 'Alex' })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    let finish!: (value: Response) => void
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const syncing = replay()
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    offline()
    await discardFailed(id, failed.itemId)
    expect(cachedList(id)!.items[failed.itemId]).toBeUndefined()
    expect(syncStatus().pending).toBe(1)
    finish(response({}, 503))
    await syncing
})


it('preserves an independent title conflict after discarding a failed list rename', async () => {
    const { discardFailed, failedEdits } = await import('../features/offline/store')
    const initial = { ...base, items: { existing: { id: 'existing', title: 'Original', created_by: 'Alex', created_at: '', completed: false } } }
    vi.mocked(fetch).mockResolvedValue(response(initial))
    await loadList(id); offline()
    const rename = await mutateList(`/list/${id}/name`, 'PUT', { name: 'Local name' })
    const title = await mutateList(`/list/${id}/items/existing/title`, 'PUT', { newTitle: 'Local title' })
    const remote = { ...initial, name: 'Remote name', items: { existing: { ...initial.items.existing, title: 'Remote title' } } }
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    vi.mocked(fetch).mockImplementation(async () => response(remote))
    await replay()
    expect(failedEdits()[0]).toMatchObject({ id: rename.itemId, status: 409 })
    await discardFailed(id, rename.itemId)
    await replay()
    expect(failedEdits()).toEqual([expect.objectContaining({ id: title.itemId, status: 409, remote: 'Remote title', local: 'Local title' })])
    const stored = JSON.parse(localStorage.getItem(`togetherlist:offline:v1:${id}`)!)
    expect(stored.queue[0].before).toBe('Original')
    expect(stored.base.items.existing.title).toBe('Remote title')
    expect(vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method)).toHaveLength(0)
})

it('requires explicit retry for a same-field successor after discarding its failed predecessor', async () => {
    const { discardFailed, failedEdits } = await import('../features/offline/store')
    await seed(); offline()
    const first = await mutateList(`/list/${id}/name`, 'PUT', { name: 'First local' })
    const second = await mutateList(`/list/${id}/name`, 'PUT', { name: 'Second local' })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    vi.mocked(fetch).mockResolvedValue(response({ ...base, name: 'Remote name' }))
    await replay()
    // Even matching the removed predecessor's value does not approve its successor.
    let name = 'First local'
    vi.mocked(fetch).mockImplementation(async (_url, options) => {
        if (options?.method) { name = JSON.parse(String(options.body)).name; return response({}) }
        return response({ ...base, name })
    })
    await discardFailed(id, first.itemId)
    await replay()
    expect(failedEdits()).toEqual([expect.objectContaining({ id: second.itemId, status: 409, detail: 'offline.fieldConflict' })])
    expect(vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method)).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem(`togetherlist:offline:v1:${id}`)!).queue[0].before).toBe('First local')
    await retryFailed()
    expect(syncStatus().pending).toBe(0)
    expect(name).toBe('Second local')
    expect(vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method)).toHaveLength(1)
})
