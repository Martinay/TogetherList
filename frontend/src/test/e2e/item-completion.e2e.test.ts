import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createBrowser, BASE_URL } from './browser-helper'
import type { Browser } from 'webdriverio'

describe('Item Completion', () => {
    let browser: Browser

    beforeAll(async () => {
        browser = await createBrowser()
    })

    afterAll(async () => {
        if (browser) {
            await browser.deleteSession()
        }
    })

    async function createListAndNavigate(): Promise<void> {
        // Navigate to landing page
        await browser.url(BASE_URL)
        const createButton = await browser.$('button=Create New List')
        await createButton.waitForDisplayed({ timeout: 5_000 })
        await createButton.click()

        // Step 1: Enter list name
        const listNameInput = await browser.$('input[placeholder="e.g., Weekend Trip"]')
        await listNameInput.waitForDisplayed({ timeout: 5_000 })
        await listNameInput.setValue('Test E2E List')
        const continueButton1 = await browser.$('button=Continue')
        await continueButton1.click()

        // Step 2: Enter creator name
        const nameInput = await browser.$('input[placeholder="Enter your name"]')
        await nameInput.waitForDisplayed({ timeout: 5_000 })
        await nameInput.setValue('TestUser')
        const continueButton2 = await browser.$('button=Continue')
        await continueButton2.click()

        // Step 3: Create list (no extra participants needed)
        const createListButton = await browser.$('button=Create List')
        await createListButton.waitForDisplayed({ timeout: 5_000 })
        await createListButton.click()

        const addInput = await browser.$('input[placeholder="What needs to be done?"]')
        await addInput.waitForDisplayed({ timeout: 10_000 })
    }

    async function addItem(title: string): Promise<void> {
        const addInput = await browser.$('input[placeholder="What needs to be done?"]')
        await addInput.setValue(title)
        const addButton = await browser.$('button=Add')
        await addButton.click()

        // Wait for the item to appear in the list
        const item = await browser.$(`span=${title}`)
        await item.waitForDisplayed({ timeout: 5_000 })
    }

    it('marks an item as completed via checkbox', async () => {
        await createListAndNavigate()
        await addItem('Buy milk')

        // Find the completion checkbox (the first button with "Mark complete" aria-label)
        const checkbox = await browser.$('button[aria-label="Mark complete"]')
        await checkbox.waitForDisplayed({ timeout: 5_000 })
        expect(await checkbox.isDisplayed()).toBe(true)

        // Click the checkbox to complete the item
        await checkbox.click()

        // Wait for the checkbox to change to "Mark incomplete" (indicating completion)
        const uncompleteCheckbox = await browser.$('button[aria-label="Mark incomplete"]')
        await uncompleteCheckbox.waitForDisplayed({ timeout: 5_000 })
        expect(await uncompleteCheckbox.isDisplayed()).toBe(true)

        // Verify the item title has strikethrough styling
        const title = await browser.$('span=Buy milk')
        const titleClass = await title.getAttribute('class')
        expect(titleClass).toContain('line-through')
    })

    it('uncompletes a completed item', async () => {
        // Item should still be completed from previous test
        const uncompleteCheckbox = await browser.$('button[aria-label="Mark incomplete"]')
        await uncompleteCheckbox.waitForDisplayed({ timeout: 5_000 })

        // Click to uncomplete
        await uncompleteCheckbox.click()

        // Wait for checkbox to change back to "Mark complete"
        const completeCheckbox = await browser.$('button[aria-label="Mark complete"]')
        await completeCheckbox.waitForDisplayed({ timeout: 5_000 })
        expect(await completeCheckbox.isDisplayed()).toBe(true)

        // Verify strikethrough is removed
        const title = await browser.$('span=Buy milk')
        const titleClass = await title.getAttribute('class')
        expect(titleClass).not.toContain('line-through')
    })
})
