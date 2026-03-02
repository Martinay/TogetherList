import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createBrowser, BASE_URL } from './browser-helper'
import type { Browser } from 'webdriverio'

describe('Landing Page', () => {
    let browser: Browser

    beforeAll(async () => {
        browser = await createBrowser()
    })

    afterAll(async () => {
        if (browser) {
            await browser.deleteSession()
        }
    })

    it('displays the app title', async () => {
        await browser.url(BASE_URL)

        const title = await browser.$('h1')
        await title.waitForDisplayed({ timeout: 5_000 })

        expect(await title.getText()).toContain('TogetherList')
    })

    it('has a visible Create New List button', async () => {
        await browser.url(BASE_URL)

        const button = await browser.$('button=Create New List')
        await button.waitForDisplayed({ timeout: 5_000 })

        expect(await button.isDisplayed()).toBe(true)
        expect(await button.isClickable()).toBe(true)
    })
})
