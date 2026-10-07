import { API_V1 } from '../../api/client'
import type { ListState } from '../view-list/types'

type Body = Record<string, unknown>
interface Operation { id: string; endpoint: string; method: string; body: Body; at: string; before?: unknown; error?: number; detail?: string; attempts?: number; retryAt?: number }
interface Snapshot { base: ListState; queue: Operation[]; version?: number }
const failedReads = new Set<string>()
const prefix = 'togetherlist:offline:v1:'
export const offlineEvent = 'togetherlist:offline'
const notify = () => window.dispatchEvent(new Event(offlineEvent))
function read(id: string): Snapshot | null {
    const raw = localStorage.getItem(prefix + id)
    return raw ? JSON.parse(raw) : null
}
function checkedState(data: unknown): ListState {
    const state = data as ListState | null
    if (!state || typeof state.name !== 'string' || !Array.isArray(state.participants) || !state.items || typeof state.items !== 'object' || Array.isArray(state.items)) throw new Error('Invalid list response')
    return state
}
function write(id: string, value: Snapshot) {
    // One atomic write keeps the snapshot and outbox consistent, including on quota failure.
    value.version = (value.version || 0) + 1
    try { localStorage.setItem(prefix + id, JSON.stringify(value)) }
    catch (error) { window.dispatchEvent(new Event('togetherlist:storage-error')); throw error }
    notify()
}
export const supportsOfflineEdits = () => !!navigator.locks
async function locked<T>(work: () => Promise<T>): Promise<T> {
    if (navigator.locks) return navigator.locks.request('togetherlist-offline', work)
    return work()
}
function apply(base: ListState, op: Operation): ListState {
    const state = structuredClone(base)
    const body = op.body
    const parts = op.endpoint.split('/')
    if (parts.at(-1) === 'name') state.name = String(body.name)
    else if (op.method === 'POST') {
        state.items[op.id] = { id: op.id, title: String(body.title), created_by: String(body.createdBy), created_at: op.at, completed: false }
    } else {
        const item = state.items[parts[4] || '']
        if (!item) return state
        switch (parts.at(-1)) {
            case 'title': item.title = String(body.newTitle); break
            case 'description': item.description = String(body.description); break
            case 'assigned-to': item.assigned_to = body.assignedTo as string[]; break
            case 'completed':
                item.completed = Boolean(body.isCompleted)
                item.completed_by = item.completed ? String(body.completedBy) : ''
                item.completed_at = item.completed ? op.at : ''
        }
    }
    return state
}
function target(state: ListState, endpoint: string): unknown {
    const parts = endpoint.split('/')
    if (parts.at(-1) === 'name') return state.name
    const item = state.items[parts[4] || '']
    if (!item) return null
    switch (parts.at(-1)) {
        case 'title': return item.title
        case 'description': return item.description || ''
        case 'assigned-to': return item.assigned_to || []
        case 'completed': return item.completed
    }
    return null
}
function projected(value: Snapshot) { return value.queue.reduce(apply, value.base) }
export function cachedList(id: string) {
    try { const value = read(id); return value ? projected(value) : null } catch { return null }
}
export function storedLists() {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix)).map(key => {
        const id = key.slice(prefix.length)
        return { id, name: cachedList(id)?.name || id }
    })
}
export function syncStatus() {
    let pending = 0, failed = false
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith(prefix)) continue
        const value = read(key.slice(prefix.length))
        pending += value?.queue.length || 0
        failed ||= !!value?.queue.some(op => op.error)
    }
    return { pending, failed, offline: !navigator.onLine, unavailable: failedReads.size > 0 }
}
export async function mutateList(endpoint: string, method: string, body: Body) {
    if (!supportsOfflineEdits()) {
        window.dispatchEvent(new Event('togetherlist:storage-error'))
        throw new Error('Safe offline storage requires browser Web Locks support')
    }
    const id = endpoint.split('/')[2]
    if (!id) throw new Error('Invalid list endpoint')
    const op: Operation = { id: crypto.randomUUID(), endpoint, method, body, at: new Date().toISOString() }
    await locked(async () => {
        const value = read(id)
        if (!value) throw new Error('List must be loaded before editing')
        op.before = target(projected(value), endpoint)
        value.queue.push(op)
        write(id, value)
    })
    void replay().catch(notify)
    return { itemId: op.id }
}
export async function loadList(id: string): Promise<ListState> {
    const initial = await locked(async () => read(id))
    if (!navigator.onLine && initial) return projected(initial)
    try {
        const response = await fetch(`${API_V1}/list/${id}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
        if (!response.ok) throw new Error(`API ${response.status}`)
        const base = checkedState(await response.json())
        failedReads.delete(id)
        return await locked(async () => {
            const latest = read(id)
            // A response started before any intervening write must not regress acknowledged edits.
            if (latest && latest.version !== initial?.version) return projected(latest)
            const next: Snapshot = { base, queue: latest?.queue || [], version: latest?.version }
            if (supportsOfflineEdits()) write(id, next)
            return projected(next)
        })
    } catch (error) {
        failedReads.add(id)
        notify()
        const latest = await locked(async () => read(id))
        if (latest) return projected(latest)
        throw error
    }
}
async function syncLocked(work: () => Promise<void>, opportunistic = false) {
    if (navigator.locks) return navigator.locks.request('togetherlist-replay', { ifAvailable: opportunistic }, lock => lock ? work() : undefined)
    return
}
async function markFailure(id: string, op: Operation, status?: number, remote?: ListState, detail?: string) {
    await locked(async () => {
        const value = read(id)!
        const head = value.queue[0]
        if (head?.id !== op.id) return
        if (remote) value.base = remote
        if (status && status >= 400 && status < 500 && ![408, 429].includes(status)) { head.error = status; head.detail = detail }
        else {
            head.attempts = (head.attempts || 0) + 1
            head.retryAt = Date.now() + Math.min(60000, 1000 * 2 ** head.attempts)
        }
        write(id, value)
    })
}
async function replayWork() {
    if (!navigator.onLine || !supportsOfflineEdits()) return
    const ids = await locked(async () => Object.keys(localStorage).filter(key => key.startsWith(prefix)).map(key => key.slice(prefix.length)))
    for (const id of ids) {
        let acknowledged = false
        while (navigator.onLine) {
            const op = await locked(async () => read(id)?.queue[0])
            if (!op || op.error || (op.retryAt || 0) > Date.now()) break
            try {
                const current = await fetch(`${API_V1}/list/${id}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
                if (!current.ok) { await markFailure(id, op, current.status, undefined, await current.text()); break }
                const remote = checkedState(await current.json())
                if (op.method !== 'POST' && remote.revision !== op.id && JSON.stringify(target(remote, op.endpoint)) !== JSON.stringify(op.before)) {
                    await markFailure(id, op, 409, remote, 'offline.fieldConflict')
                    break
                }
                const response = await fetch(`${API_V1}${op.endpoint}`, {
                    signal: AbortSignal.timeout(10000), method: op.method, body: JSON.stringify(op.body),
                    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': op.id, ...(remote.revision ? { 'If-Match': remote.revision } : {}) },
                })
                if (!response.ok) { await markFailure(id, op, response.status, undefined, await response.text()); break }
                await locked(async () => {
                    const value = read(id)!
                    if (value.queue[0]?.id !== op.id) return
                    value.base = apply(remote, op)
                    value.base.revision = op.id
                    value.queue.shift()
                    write(id, value)
                })
                acknowledged = true
            } catch { await markFailure(id, op); break }
        }
        if (acknowledged) await loadList(id)
    }
}
let activeReplay: Promise<void> | null = null
export async function replay() {
    if (!navigator.onLine) return
    if (!activeReplay) activeReplay = syncLocked(replayWork, true).finally(() => { activeReplay = null })
    return activeReplay
}
export async function retryFailed() {
    if (!supportsOfflineEdits()) return
    await syncLocked(async () => {
        const ids = await locked(async () => Object.keys(localStorage).filter(key => key.startsWith(prefix) && read(key.slice(prefix.length))?.queue.length).map(key => key.slice(prefix.length)))
        for (const id of ids) {
            let remote: ListState | undefined
            if (navigator.onLine) {
                try {
                    const response = await fetch(`${API_V1}/list/${id}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
                    if (response.ok) remote = checkedState(await response.json())
                } catch { /* Keep the latest durable base when connectivity fails. */ }
            }
            await locked(async () => {
                const value = read(id)!
                if (remote) value.base = remote
                let projectedBase = value.base
                value.queue.forEach(op => {
                    if (op.error && op.error !== 409) { projectedBase = apply(projectedBase, op); return }
                    // Explicit retry applies saved edits over the latest shared field values.
                    op.before = target(projectedBase, op.endpoint)
                    projectedBase = apply(projectedBase, op)
                    delete op.error; delete op.detail; delete op.retryAt; delete op.attempts
                })
                write(id, value)
            })
        }
        await replayWork()
    })
}

export function failedEdits() {
    return Object.keys(localStorage).filter(key => key.startsWith(prefix)).flatMap(key => {
        const value = read(key.slice(prefix.length))!
        return value.queue.filter(op => op.error).map(op => ({
            id: op.id,
            listId: key.slice(prefix.length),
            status: op.error,
            detail: op.detail,
            endpoint: op.endpoint,
            method: op.method,
            list: value.base.name,
            local: op.method === 'POST' ? op.body.title : target(apply(value.base, op), op.endpoint),
            remote: target(value.base, op.endpoint),
        }))
    })
}

export async function discardFailed(listId: string, operationId: string) {
    if (!supportsOfflineEdits()) throw new Error('Web Locks required')
    await locked(async () => {
        const value = read(listId)
        const failed = value?.queue.find(op => op.id === operationId && op.error)
        if (!value || !failed) return
        const successors = value.queue.slice(value.queue.indexOf(failed) + 1)
        // Dropping a failed creation also drops edits targeting its never-created item.
        value.queue = value.queue.filter(op => op.id !== failed.id &&
            !(failed.method === 'POST' && op.endpoint.split('/')[4] === failed.id))
        for (const op of successors) {
            // Removing a same-field predecessor requires explicit retry, not implicit overwrite approval.
            if (failed.method !== 'POST' && op.endpoint === failed.endpoint && !op.error) {
                op.error = 409
                op.detail = 'offline.fieldConflict'
            }
        }
        write(listId, value)
    })
    await replay()
}
