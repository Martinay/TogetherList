import { it, expect } from 'vitest'
import { randomUUID } from 'node:crypto'
import { BASE_URL, closeBrowser, createBrowser } from './browser-helper'
import { join, state } from './fixtures'
interface Result { content?: Array<{ text: string }>; isError?: boolean; [key: string]: unknown }
async function rpc(method: string, params: unknown = {}, path = '/api/v1/mcp') {
    const response = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })
    expect(response.status).toBe(200)
    return response.json() as Promise<{ result: Result; error?: unknown }>
}
async function tool(name: string, args: Record<string, unknown>) {
    const reply = await rpc('tools/call', { name, arguments: args })
    expect(reply.error).toBeUndefined()
    expect(reply.result.isError).not.toBe(true)
    return JSON.parse(reply.result.content![0]!.text)
}
it('uses every MCP tool over HTTP with the same persisted state visible in the browser', async () => {
    const initialized = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'e2e', version: '1' } })
    expect(initialized.result.serverInfo).toMatchObject({ name: 'TogetherList' })
    const tools = await rpc('tools/list', {}, '/mcp')
    expect((tools.result.tools as Array<{ name: string }>).map(t => t.name).sort()).toEqual(['list_lists', 'get_list', 'create_list', 'rename_list', 'add_item', 'complete_item', 'assign_item', 'update_item_title', 'update_item_description'].sort())
    const { listId } = await tool('create_list', { name: 'MCP groceries', creator: 'Alex', participants: ['Sam'] })
    const { itemId } = await tool('add_item', { list_id: listId, title: 'Milk', created_by: 'Alex' })
    const target = { list_id: listId, item_id: itemId }
    await tool('rename_list', { list_id: listId, name: 'MCP shopping', renamed_by: 'Sam' })
    await tool('update_item_title', { ...target, title: 'Oat milk' })
    await tool('update_item_description', { ...target, description: 'Two cartons' })
    await tool('assign_item', { ...target, assigned_to: ['Alex', 'Sam'] })
    await tool('complete_item', { ...target, completed: true, completed_by: 'Sam' })
    const read = await tool('get_list', { list_id: listId })
    expect(read).toMatchObject({ name: 'MCP shopping', items: { [itemId]: { title: 'Oat milk', description: 'Two cartons', completed: true, completed_by: 'Sam', assigned_to: ['Alex', 'Sam'] } } })
    const summaries = await tool('list_lists', {})
    expect(summaries).toEqual(expect.arrayContaining([expect.objectContaining({ id: listId, completedCount: 1, itemCount: 1 })]))
    const resource = await rpc('resources/read', { uri: `list://${listId}` })
    expect(JSON.parse((resource.result.contents as Array<{ text: string }>)[0]!.text)).toMatchObject({ name: 'MCP shopping' })
    const browser = await createBrowser()
    try {
        await join(browser, listId, 'Sam')
        await browser.$('span=Oat milk').waitForDisplayed()
        expect(await browser.$('[data-testid="list-title"]').getText()).toBe('MCP shopping')
        expect(await browser.$('button[aria-label="Mark incomplete"]').isDisplayed()).toBe(true)
        expect(await browser.$('body').getText()).toContain('Two cartons')
    } finally { await closeBrowser(browser) }
    await tool('complete_item', { ...target, completed: false, completed_by: 'Alex' })
    expect((await state(listId)).items[itemId]?.completed).toBe(false)
})
it('returns MCP tool errors for invalid and missing lists, and protocol errors for unknown methods', async () => {
    for (const list_id of ['invalid', randomUUID()]) {
        const reply = await rpc('tools/call', { name: 'get_list', arguments: { list_id } })
        expect(reply.result.isError).toBe(true)
    }
    expect((await rpc('unknown/method')).error).toBeDefined()
    const response = await fetch(`${BASE_URL}/api/v1/mcp`, { method: 'POST', body: '{' })
    expect(response.status).toBe(400)
})
it.each(['/api/v1/mcp/sse', '/mcp/sse'])('roundtrips JSON-RPC through an SSE session at %s and rejects missing message sessions', async path => {
    const abort = new AbortController()
    try {
        const response = await fetch(`${BASE_URL}${path}`, { signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15000)]) })
        expect(response.status).toBe(200)
        expect(response.headers.get('content-type')).toContain('text/event-stream')
        const reader = response.body!.getReader()
        async function readEvent() {
            const decoder = new TextDecoder()
            let event = ''
            while (!/\r?\n\r?\n/.test(event)) {
                const next = await reader.read()
                expect(next.done).toBe(false)
                event += decoder.decode(next.value, { stream: true })
            }
            return event
        }
        const advertised = await readEvent()
        expect(advertised).toContain('sessionId=')
        const endpoint = advertised.match(/data: ([^\n]+)/)![1]!.trim()
        const posted = await fetch(new URL(endpoint, BASE_URL), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 42, method: 'tools/list', params: {} }) })
        expect(posted.status).toBe(202)
        const message = await readEvent()
        const payload = JSON.parse(message.match(/data: (.*)/)![1]!)
        expect(payload.id).toBe(42)
        expect(payload.result.tools).toHaveLength(9)
    } finally { abort.abort() }
    const response = await fetch(`${BASE_URL}${path.replace('/sse', '/messages')}`, { method: 'POST', body: '{}' })
    expect(response.status).toBe(400)
})
