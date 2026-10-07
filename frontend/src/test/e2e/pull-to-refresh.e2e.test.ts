import { beforeEach, afterEach, it, expect } from 'vitest'
import type { Browser } from 'webdriverio'
import { closeBrowser, createBrowser, cdp } from './browser-helper'
import { seed, join, request } from './fixtures'
let browser: Browser
beforeEach(async () => { browser = await createBrowser(); await browser.setWindowSize(390, 844) })
afterEach(async () => { if (browser) await closeBrowser(browser) })
async function gesture(distance: number, selector = '[data-testid="list-title"]') {
    const element = await browser.$(selector)
    const pos = await element.getLocation()
    const x = Math.round(pos.x + 10), y = Math.round(pos.y + 10)
    await cdp(browser, 'Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await cdp(browser, 'Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + distance }] })
    if (distance >= 72 && selector === '[data-testid="list-title"]') {
        await browser.$('div=Release to refresh').waitForDisplayed()
    }
    await cdp(browser, 'Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
it('refreshes real shared state with a touch gesture without navigating or losing identity', async () => {
    const id = await seed()
    await join(browser, id)
    // Blocking GETs makes the gesture deterministic against the independent 3-second poll.
    await cdp(browser, 'Network.enable')
    await cdp(browser, 'Network.setBlockedURLs', { urls: ['*/api/v1/list/*'] })
    expect((await request(`/list/${id}/name`, 'PUT', { name: 'Updated by Sam', renamedBy: 'Sam' })).status).toBe(200)
    await cdp(browser, 'Network.setBlockedURLs', { urls: [] })
    const url = await browser.getUrl()
    await gesture(110)
    await browser.waitUntil(async () => (await browser.$('[data-testid="list-title"]').getText()) === 'Updated by Sam')
    expect(await browser.getUrl()).toBe(url)
    expect(await browser.$('[role="button"]').getText()).toContain('Alex')
})
it('ignores short pulls and input gestures and shows failure then recovers on another pull', async () => {
    const id = await seed()
    await join(browser, id)
    await gesture(25)
    expect(await browser.$('div=Release to refresh').isExisting()).toBe(false)
    await gesture(110, 'input[placeholder="What needs to be done?"]')
    expect(await browser.$('div=Release to refresh').isExisting()).toBe(false)
    await cdp(browser, 'Network.enable')
    await cdp(browser, 'Network.setBlockedURLs', { urls: ['*/api/v1/list/*'] })
    await gesture(110)
    await browser.$('[role="status"]=Failed to load list').waitForDisplayed()
    await cdp(browser, 'Network.setBlockedURLs', { urls: [] })
    await gesture(110)
    await browser.waitUntil(async () => !(await browser.$('[role="status"]=Failed to load list').isExisting()))
    expect(await browser.$('[data-testid="list-title"]').getText()).toBe('Shared groceries')
})
