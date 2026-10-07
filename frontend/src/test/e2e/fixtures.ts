import { expect } from 'vitest'
import type { Browser } from 'webdriverio'
import { BASE_URL } from './browser-helper'
import type { ListState } from '../../features/view-list/types'
export async function request(path: string, method = 'GET', body?: unknown, headers = {}) {
    return fetch(`${BASE_URL}/api/v1${path}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
}
export async function seed(name = 'Shared groceries') {
    const response = await request('/list/create', 'POST', { name, creator: 'Alex', participants: ['Alex', 'Sam'] })
    expect(response.status).toBe(201)
    return (await response.json() as { listId: string }).listId
}
export async function state(id: string): Promise<ListState> {
    const response = await request(`/list/${id}`)
    expect(response.status).toBe(200)
    return response.json()
}
export async function join(browser: Browser, id: string, name = 'Alex') {
    await browser.url(`${BASE_URL}/list/${id}`)
    await browser.$(`button=${name}`).waitForClickable()
    await browser.$(`button=${name}`).click()
    await browser.$('[data-testid="list-title"]').waitForDisplayed()
}
export async function add(browser: Browser, title: string) {
    await browser.$('input[placeholder="What needs to be done?"]').setValue(title)
    await browser.$('button=Add').click()
    await browser.$(`span=${title}`).waitForDisplayed()
}
export async function settled(browser: Browser) {
    await browser.waitUntil(async () => {
        const drained = await browser.execute(() => Object.keys(localStorage)
            .filter(key => key.startsWith('togetherlist:offline:v1:'))
            .every(key => JSON.parse(localStorage.getItem(key)!).queue.length === 0))
        return drained && !(await browser.$('[role="status"]').isExisting())
    }, { timeout: 15000 })
}
