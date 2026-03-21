import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createBrowser, BASE_URL } from './browser-helper'
import type { Browser } from 'webdriverio'

describe('Debug Rename List', () => {
    let browser: Browser

    beforeAll(async () => {
        browser = await createBrowser()
    })

    afterAll(async () => {
        if (browser) {
            await browser.deleteSession()
        }
    })

    it('debug: creates a list and checks h1', async () => {
        await browser.url(BASE_URL)

        // Click create list
        const createBtn = await browser.$('button=Create New List')
        await createBtn.waitForDisplayed({ timeout: 5000 })
        await createBtn.click()

        // Step 1: Name list
        const listNameInput = await browser.$('input[placeholder="e.g., Weekend Trip"]')
        await listNameInput.waitForDisplayed({ timeout: 5000 })
        await listNameInput.setValue('Test E2E List')
        const continueBtn1 = await browser.$('button=Continue')
        await continueBtn1.click()

        // Step 2: Name creator
        const creatorNameInput = await browser.$('input[placeholder="Enter your name"]')
        await creatorNameInput.waitForDisplayed({ timeout: 5000 })
        await creatorNameInput.setValue('E2E User')
        const continueBtn2 = await browser.$('button=Continue')
        await continueBtn2.click()

        // Step 3: Participants — click create
        const createListBtn = await browser.$('button=Create List')
        await createListBtn.waitForDisplayed({ timeout: 5000 })
        await createListBtn.click()

        // Wait for the add item form to appear (known working approach)
        const addInput = await browser.$('input[placeholder="What needs to be done?"]')
        await addInput.waitForDisplayed({ timeout: 10000 })

        // Now debug: check the h1
        const h1 = await browser.$('h1')
        const isDisplayed = await h1.isDisplayed()
        const text = await h1.getText()
        const html = await h1.getHTML()

        console.log('=== DEBUG h1 ===')
        console.log('isDisplayed:', isDisplayed)
        console.log('getText:', JSON.stringify(text))
        console.log('getHTML:', html)
        console.log('=== END DEBUG ===')

        // Also check the page URL
        const url = await browser.getUrl()
        console.log('Current URL:', url)

        // Check all h1 elements
        const allH1 = await browser.$$('h1')
        console.log('Number of h1 elements:', allH1.length)
        for (let i = 0; i < allH1.length; i++) {
            const t = await allH1[i].getText()
            console.log(`h1[${i}] text:`, JSON.stringify(t))
        }

        expect(text).toBe('Test E2E List')
    })
})
