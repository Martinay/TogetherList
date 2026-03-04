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
        await createBtn.click()

        // Name list step
        const listNameInput = await browser.$('input[placeholder="e.g., Weekend Trip"]')
        await listNameInput.waitForDisplayed()
        await listNameInput.setValue('Test E2E List')
        const continueBtn1 = await browser.$('button=Continue')
        await continueBtn1.click()

        // Name creator step
        const creatorNameInput = await browser.$('input[placeholder="Enter your name"]')
        await creatorNameInput.waitForDisplayed()
        await creatorNameInput.setValue('E2E User')
        const continueBtn2 = await browser.$('button=Continue')
        await continueBtn2.click()

        // Participants step
        const createListFinalBtn = await browser.$('#create-list-button')
        await createListFinalBtn.waitForDisplayed()
        await createListFinalBtn.click()

        // Give it time to load the list page
        const header = await browser.$('h1')
        await header.waitForDisplayed()
    }

    it('creates a list and allows renaming it', async () => {
        await createListAndJoin()

        // 1. Check initial title
        let title = await browser.$('h1')
        expect(await title.getText()).toBe('Test E2E List')

        // 2. Click the edit button
        const editBtn = await browser.$('button[title="Edit list name"]')
        await editBtn.waitForDisplayed()
        await editBtn.click()

        // 3. Edit title in input
        const input = await browser.$('input[type="text"]')
        await input.waitForDisplayed()
        await input.setValue('Renamed E2E List')

        // 4. Save
        const saveBtn = await browser.$('button[title="Save"]')
        await saveBtn.click()

        // 5. Verify the new title is displayed
        title = await browser.$('h1')
        await title.waitForDisplayed()
        expect(await title.getText()).toBe('Renamed E2E List')
    })
})
