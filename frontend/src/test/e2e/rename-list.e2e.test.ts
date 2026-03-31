import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createBrowser, BASE_URL } from './browser-helper'
import type { Browser } from 'webdriverio'

describe('Rename List E2E', () => {
    let browser: Browser

    beforeAll(async () => {
        browser = await createBrowser()
    })

    afterAll(async () => {
        if (browser) {
            await browser.deleteSession()
        }
    })

    const createListAndJoin = async () => {
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

        // Wait for list page to load with the correct list name
        await browser.waitUntil(
            async () => {
                const h1 = await browser.$('[data-testid="list-title"]')
                if (!await h1.isDisplayed()) return false
                const text = await h1.getText()
                return text === 'Test E2E List'
            },
            { timeout: 10000, timeoutMsg: 'h1 did not show list name "Test E2E List"' }
        )
    }

    async function renameList(newName: string) {
        // Click the edit button
        const editBtn = await browser.$('[data-testid="edit-list-name"]')
        await editBtn.waitForDisplayed({ timeout: 5000 })
        await editBtn.click()

        // Edit title in input
        const input = await browser.$('[data-testid="edit-list-input"]')
        await input.waitForDisplayed({ timeout: 5000 })
        await input.setValue(newName)

        // Save using JS click to prevent overlay interception
        await browser.execute(() => {
            const btn = document.querySelector('[data-testid="save-list-name"]') as HTMLButtonElement | null;
            if (btn) btn.click();
        });

        // Verify the new title is displayed
        const title = await browser.$('[data-testid="list-title"]')
        await title.waitForDisplayed({ timeout: 5000 })
        expect(await title.getText()).toBe(newName)
    }

    it('creates a list and verifies initial title', async () => {
        await createListAndJoin()

        // Check initial title
        const title = await browser.$('[data-testid="list-title"]')
        await title.waitForDisplayed({ timeout: 5000 })
        expect(await title.getText()).toBe('Test E2E List')
    })

    it('allows renaming the list to standard text', async () => {
        // Relies on the previous test having created the list
        await renameList('Renamed E2E List')
    })

    it('allows renaming the list with emojis and special characters', async () => {
        // Relies on the previous test having created the list
        await renameList('Renamed E2E List 😊❤️🛳️')
    })
})
