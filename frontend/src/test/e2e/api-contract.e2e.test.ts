import { it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { request, seed, state } from './fixtures'
import { BASE_URL } from './browser-helper'

it('rejects malformed JSON and missing creation fields and duplicate participants through real HTTP', async () => {
    const invalid = await fetch(`${BASE_URL}/api/v1/list/create`, { method: 'POST', body: '{' })
    expect(invalid.status).toBe(400)
    for (const body of [{ name: 'List' }, { creator: 'Alex' }, { name: 'List', creator: 'Alex', participants: ['Sam', 'Sam'] }]) {
        expect((await request('/list/create', 'POST', body)).status).toBe(400)
    }
    expect((await request('/list/create', 'GET')).status).toBe(405)
})
it('deduplicates retried creation and item mutations, rejects conflicting retry keys and stale revisions', async () => {
    const key = randomUUID(), body = { name: 'Idempotent', creator: 'Alex' }
    const first = await request('/list/create', 'POST', body, { 'Idempotency-Key': key })
    expect(first.status).toBe(201)
    const second = await request('/list/create', 'POST', body, { 'Idempotency-Key': key })
    expect(second.status).toBe(201)
    expect(await second.json()).toEqual(await first.json())
    expect((await request('/list/create', 'POST', { ...body, name: 'Conflict' }, { 'Idempotency-Key': key })).status).toBe(409)
    const revision = (await state(key)).revision!
    const operation = randomUUID(), add = { title: 'Once', createdBy: 'Alex' }
    for (let i = 0; i < 2; i++) {
        expect((await request(`/list/${key}/items`, 'POST', add, { 'Idempotency-Key': operation, 'If-Match': revision })).status).toBe(201)
    }
    expect(Object.keys((await state(key)).items)).toHaveLength(1)
    expect((await request(`/list/${key}/name`, 'PUT', { name: 'Stale', renamedBy: 'Alex' }, { 'If-Match': revision })).status).toBe(409)
    expect((await state(key)).name).toBe('Idempotent')
    expect((await request(`/list/${key}/items`, 'POST', add, { 'Idempotency-Key': 'invalid' })).status).toBe(400)
})
it('rejects invalid IDs, missing items, blank titles and unknown assignees without changing state', async () => {
    const id = await seed(), missing = randomUUID()
    expect((await request('/list/not-a-uuid')).status).toBe(400)
    expect((await request(`/list/${missing}`)).status).toBe(404)
    expect((await request(`/list/${id}/items`, 'POST', { title: '', createdBy: 'Alex' })).status).toBe(400)
    const added = await request(`/list/${id}/items`, 'POST', { title: 'Untouched', createdBy: 'Alex' })
    expect(added.status).toBe(201)
    const item = Object.values((await state(id)).items)[0]!
    const before = await state(id)
    expect((await request(`/list/${id}/items/${item.id}/title`, 'PUT', { newTitle: ' ' })).status).toBe(400)
    expect((await request(`/list/${id}/items/${item.id}/assigned-to`, 'PUT', { assignedTo: ['Unknown'] })).status).toBe(400)
    expect((await request(`/list/${id}/items/${missing}/assigned-to`, 'PUT', { assignedTo: ['Alex'] })).status).toBe(404)
    expect((await request(`/list/${id}/items/invalid/completed`, 'PUT', { isCompleted: true, completedBy: 'Alex' })).status).toBe(400)
    expect(await state(id)).toEqual(before)
})
it('serves production deep links, translations, worker assets and crawler documentation', async () => {
    for (const path of ['/', '/list/new', `/list/${randomUUID()}`, '/sw.js', '/offline-shell.json', '/llms.txt', '/llms-full.txt', '/locales/en/translation.json']) {
        const response = await fetch(`${BASE_URL}${path}`)
        expect(response.status, path).toBe(200)
        expect((await response.text()).length).toBeGreaterThan(20)
    }
    const crawler = await fetch(BASE_URL, { headers: { 'User-Agent': 'Googlebot' } })
    expect(await crawler.text()).toContain('TogetherList')
    expect((await fetch(`${BASE_URL}/api/v1/does-not-exist`)).status).toBe(404)
})
