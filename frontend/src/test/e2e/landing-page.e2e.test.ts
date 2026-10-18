import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { closeBrowser, createBrowser, BASE_URL } from './browser-helper'
import type { Browser } from 'webdriverio'

describe('Landing Page SEO/GEO', () => {
    let browser: Browser

    beforeAll(async () => {
        browser = await createBrowser()
    })

    afterAll(async () => {
        if (browser) {
            await closeBrowser(browser)
        }
    })

    it('displays the no-signup headline', async () => {
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

    it('renders the MCP workflow, accurate transports and access warning', async () => {
        await browser.url(BASE_URL)
        const section = browser.$('#mcp')
        await section.waitForExist()
        const text = await section.getText()
        for (const claim of ['From meal plan to shared groceries', 'legacy HTTP/SSE', '/api/v1/mcp/sse', 'not Streamable HTTP', 'Anyone holding a list link or ID', 'no global list enumeration', 'update_item_title', 'update_item_description']) expect(text).toContain(claim)
        expect(await section.$('a[href="/llms-full.txt"]').isExisting()).toBe(true)
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

it('serves matching human and crawler answers, schema, metadata and local assets without indexing list data', async () => {
    const browser = await createBrowser()
    try {
        const unknownCrawler = await fetch(BASE_URL, { headers: { 'User-Agent': 'UnknownSearchCrawler' } })
        expect(await unknownCrawler.text()).toContain('content="index, follow"')
        await browser.url(BASE_URL)
        await browser.$('#mcp').waitForExist()
        const snapshot = () => {
            const read = (doc: Document) => ({
                title: doc.title,
                description: doc.querySelector('meta[name="description"]')?.getAttribute('content'),
                canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
                image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
                faq: [...doc.querySelectorAll('#faq details')].map(el => ({ question: el.querySelector('summary')!.textContent, answer: el.querySelector('p')!.textContent })),
                schema: [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(el => JSON.parse(el.textContent!)),
            })
            return read(document)
        }
        const human = await browser.execute(snapshot)
        for (const agent of ['Googlebot', 'GPTBot', 'WhatsApp']) {
            const response = await fetch(BASE_URL, { headers: { 'User-Agent': agent } })
            expect(response.status).toBe(200)
            const html = await response.text()
            const crawler = await browser.execute((html) => {
                const doc = new DOMParser().parseFromString(html, 'text/html')
                return {
                    title: doc.title,
                    description: doc.querySelector('meta[name="description"]')?.getAttribute('content'),
                    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
                    image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
                    faq: [...doc.querySelectorAll('#faq details')].map(el => ({ question: el.querySelector('summary')!.textContent, answer: el.querySelector('p')!.textContent })),
                    schema: [...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(el => JSON.parse(el.textContent!)),
                }
            }, html)
            expect(crawler).toEqual(human)
            for (const key of ['MCP', 'legacy HTTP/SSE', 'not Streamable HTTP', 'Anyone holding a list link or ID', 'no global list enumeration']) expect(html).toContain(key)
        }
        const faqSchema = human.schema.find((s: { '@type': string }) => s['@type'] === 'FAQPage')
        expect(faqSchema.mainEntity.map((q: { name: string; acceptedAnswer: { text: string } }) => ({ question: q.name, answer: q.acceptedAnswer.text }))).toEqual(human.faq)
        for (const path of ['/favicon.svg', '/social-card.png', '/llms.txt', '/llms-full.txt']) expect((await fetch(BASE_URL + path)).status).toBe(200)
        const docs = await (await fetch(BASE_URL + '/llms-full.txt')).text()
        for (const tool of ['create_list', 'get_list', 'rename_list', 'add_item', 'complete_item', 'assign_item', 'update_item_title', 'update_item_description']) expect(docs).toContain(tool)
        const robots = await (await fetch(BASE_URL + '/robots.txt')).text()
        expect(robots).toContain('Disallow: /list/')
        expect(robots).toContain('Disallow: /api/')
        const sitemap = await (await fetch(BASE_URL + '/sitemap.xml')).text()
        expect(sitemap).not.toContain('/list/')
        await browser.$('#create-list-button').click()
        await browser.$('input').waitForDisplayed()
        expect(await browser.$('meta[name="robots"]').getAttribute('content')).toBe('noindex, nofollow')
        expect(await browser.$('link[rel="canonical"]').isExisting()).toBe(false)
        expect(await browser.$('meta[property="og:image"]').isExisting()).toBe(false)
        const deepLink = await (await fetch(BASE_URL + '/list/00000000-0000-4000-8000-000000000001', { headers: { 'User-Agent': 'GPTBot' } })).text()
        expect(deepLink).toContain('noindex, nofollow')
        expect(deepLink).not.toContain('application/ld+json')
    } finally { await closeBrowser(browser) }
})

it('keeps the English MCP fallback readable without overflow in mobile RTL', async () => {
    const browser = await createBrowser()
    try {
        await browser.setWindowSize(360, 800)
        await browser.url(BASE_URL)
        await browser.execute(() => localStorage.setItem('i18nextLng', 'ar'))
        await browser.refresh()
        await browser.waitUntil(async () => (await browser.$('html').getAttribute('dir')) === 'rtl')
        const section = browser.$('#mcp')
        await section.scrollIntoView()
        expect(await section.$('h2').getText()).toBe('Let an agent plan. Let people take it from there.')
        expect(await section.getCSSProperty('direction')).toMatchObject({ value: 'ltr' })
        expect(await browser.$('#hero h1 + p').getCSSProperty('direction')).toMatchObject({ value: 'ltr' })
        expect(await browser.$('#features .grid > div:nth-child(2) p').getCSSProperty('direction')).toMatchObject({ value: 'ltr' })
        expect(await browser.$('#faq details').getCSSProperty('direction')).toMatchObject({ value: 'ltr' })
        expect(await browser.execute(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        expect(await section.getText()).not.toContain('landing.mcp.')
    } finally { await closeBrowser(browser) }
})
