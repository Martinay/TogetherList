import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createBrowser, BASE_URL } from './browser-helper'
import type { Browser } from 'webdriverio'

describe('Landing Page SEO/GEO', () => {
    let browser: Browser

    beforeAll(async () => {
        browser = await createBrowser()
    })

    afterAll(async () => {
        if (browser) {
            await browser.deleteSession()
        }
    })

    it('displays the keyword-rich headline', async () => {
        await browser.url(BASE_URL)

        const heading = await browser.$('h1')
        await heading.waitForDisplayed({ timeout: 5_000 })

        const text = await heading.getText()
        expect(text).toContain('No Sign-Up Required')
    })

    it('has a visible Create New List button', async () => {
        await browser.url(BASE_URL)

        const button = await browser.$('#create-list-button')
        await button.waitForDisplayed({ timeout: 5_000 })

        expect(await button.isDisplayed()).toBe(true)
        expect(await button.isClickable()).toBe(true)
    })

    it('renders the How It Works section', async () => {
        await browser.url(BASE_URL)

        const section = await browser.$('#how-it-works')
        await section.waitForExist({ timeout: 5_000 })

        const heading = await section.$('h2')
        expect(await heading.getText()).toBe('How It Works')

        const steps = await section.$$('li')
        expect(steps.length).toBe(3)
    })

    it('renders the Features section with 6 cards', async () => {
        await browser.url(BASE_URL)

        const section = await browser.$('#features')
        await section.waitForExist({ timeout: 5_000 })

        const heading = await section.$('h2')
        expect(await heading.getText()).toBe('Features')

        const cards = await section.$$('h3')
        expect(cards.length).toBe(6)
    })

    it('renders the Use Cases section', async () => {
        await browser.url(BASE_URL)

        const section = await browser.$('#use-cases')
        await section.waitForExist({ timeout: 5_000 })

        const heading = await section.$('h2')
        expect(await heading.getText()).toBe('Perfect For')
    })

    it('renders the Comparison section with alternatives', async () => {
        await browser.url(BASE_URL)

        const section = await browser.$('#comparison')
        await section.waitForExist({ timeout: 5_000 })

        const heading = await section.$('h2')
        expect(await heading.getText()).toBe('Why TogetherList?')

        const items = await section.$$('li')
        expect(items.length).toBe(4)
    })

    it('renders the FAQ section with collapsible items', async () => {
        await browser.url(BASE_URL)

        const section = await browser.$('#faq')
        await section.waitForExist({ timeout: 5_000 })

        const heading = await section.$('h2')
        expect(await heading.getText()).toBe('Frequently Asked Questions')

        const details = await section.$$('details')
        expect(details.length).toBe(8)
    })

    it('FAQ items expand on click', async () => {
        await browser.url(BASE_URL)

        const firstFaq = await browser.$('#faq details:first-child summary')
        await firstFaq.waitForDisplayed({ timeout: 5_000 })
        await firstFaq.click()

        const answer = await browser.$('#faq details:first-child p')
        await answer.waitForDisplayed({ timeout: 3_000 })
        expect(await answer.isDisplayed()).toBe(true)
    })

    it('navigates to /list/new when CTA is clicked', async () => {
        await browser.url(BASE_URL)

        const button = await browser.$('#create-list-button')
        await button.waitForDisplayed({ timeout: 5_000 })
        await button.click()

        await browser.waitUntil(
            async () => (await browser.getUrl()).includes('/list/new'),
            { timeout: 5_000 }
        )

        expect(await browser.getUrl()).toContain('/list/new')
    })
})
