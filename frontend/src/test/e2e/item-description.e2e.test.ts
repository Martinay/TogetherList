import { it, expect } from 'vitest'
import { closeBrowser, createBrowser, setText } from './browser-helper'
import { add, join, seed, settled, state } from './fixtures'

it('allows adding, editing, and previewing item description', async () => {
    const browser = await createBrowser()
    try {
        const id = await seed('Description E2E')
        await join(browser, id)
        await add(browser, 'Clean the house')
        await settled(browser)
        await browser.$('button[aria-expanded]:not([aria-haspopup])').click()
        const selector = 'textarea[aria-label="Item description"]'
        await setText(browser, selector, 'Vacuum the living room')
        await browser.$('button[aria-expanded]:not([aria-haspopup])').click()
        await settled(browser)
        const preview = await browser.$('[data-testid="item-description-preview"]')
        await preview.waitForDisplayed()
        expect(await preview.getText()).toBe('Vacuum the living room')
        expect(await preview.getAttribute('class')).toContain('truncate')
        expect(Object.values((await state(id)).items)[0]?.description).toBe('Vacuum the living room')
        await browser.refresh()
        await browser.$('[data-testid="item-description-preview"]').waitForDisplayed()
        expect(await browser.$('[data-testid="item-description-preview"]').getText()).toBe('Vacuum the living room')
        await browser.$('button[aria-expanded]:not([aria-haspopup])').click()
        await setText(browser, selector, 'Mop the kitchen')
        await browser.$('button[aria-expanded]:not([aria-haspopup])').click()
        await settled(browser)
        expect(Object.values((await state(id)).items)[0]?.description).toBe('Mop the kitchen')
        await browser.$('[data-testid="item-description-preview"]').waitForDisplayed()
        expect(await browser.$('[data-testid="item-description-preview"]').getText()).toBe('Mop the kitchen')
        await browser.$('button[aria-expanded]:not([aria-haspopup])').click()
        await setText(browser, selector, '')
        // Empty insertText does not erase the selection; Backspace is normal user input.
        await browser.keys('Backspace')
        await browser.$('button[aria-expanded]:not([aria-haspopup])').click()
        await settled(browser)
        // Empty descriptions are omitted by the API's JSON projection.
        expect(Object.values((await state(id)).items)[0]?.description).toBeUndefined()
        expect(await browser.$('[data-testid="item-description-preview"]').isExisting()).toBe(false)
        await browser.refresh()
        await browser.$('span=Clean the house').waitForDisplayed()
        expect(await browser.$('[data-testid="item-description-preview"]').isExisting()).toBe(false)
    } finally { await closeBrowser(browser) }
})
