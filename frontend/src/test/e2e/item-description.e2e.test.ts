import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createBrowser, BASE_URL } from './browser-helper'
import type { Browser } from 'webdriverio'

describe('Item Description', () => {
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

        // Step 1: Enter creator name
        const nameInput = await browser.$('input[type="text"]')
        await nameInput.waitForDisplayed({ timeout: 5_000 })
        await nameInput.setValue('TestUser')
        const continueButton = await browser.$('button=Continue')
        await continueButton.click()

        // Step 2: Create list
        const createListButton = await browser.$('button=Create List')
        await createListButton.waitForDisplayed({ timeout: 5_000 })
        await createListButton.click()

        // Wait for list page to load — identity picker should appear
        const identityButton = await browser.$('button=TestUser')
        await identityButton.waitForDisplayed({ timeout: 5_000 })
        await identityButton.click()

        // Wait for the add item form to appear
        const addInput = await browser.$('input[placeholder="What needs to be done?"]')
        await addInput.waitForDisplayed({ timeout: 5_000 })
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

    it('allows adding, editing, and previewing item description', async () => {
        await createListAndNavigate()
        await addItem('Clean the house')

        // Find the expand button (it has the title text next to an expand caret)
        const expandButton = await browser.$('span=▼').parentElement()
        await expandButton.waitForDisplayed({ timeout: 2_000 })

        // 1. Expand the item
        await expandButton.click()

        // Find the description textarea
        const textarea = await browser.$('textarea[aria-label="Item description"]')
        await textarea.waitForDisplayed({ timeout: 2_000 })

        // 2. Type a description using native React setter to ensure onChange fires
        await browser.execute((el: HTMLTextAreaElement) => {
            // React 16+ overrides the value setter, we must use the native one
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            )?.set;

            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(el, 'Vacuum the living room');
            } else {
                el.value = 'Vacuum the living room';
            }

            // Dispatch input and change
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));

            // Dispatch blur
            el.blur();
            el.dispatchEvent(new Event('blur', { bubbles: true }));
            el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        }, textarea as unknown as HTMLTextAreaElement)

        // Wait for the API round-trip (save + refreshList)
        await browser.pause(2000)

        // 4. Collapse the item
        const collapseButton = await browser.$('span=▲').parentElement()
        await collapseButton.click()

        // 5. Verify the 1-line preview is visible via data-testid
        const preview = await browser.$('[data-testid="item-description-preview"]')
        await preview.waitForDisplayed({ timeout: 5_000 })

        // Verify it contains the typed text
        const text = await preview.getText()
        expect(text).toContain('Vacuum the living room')
        const previewClass = await preview.getAttribute('class')
        expect(previewClass).toContain('truncate')
    })
})
