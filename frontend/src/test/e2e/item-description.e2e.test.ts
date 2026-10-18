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


it('clamps overflowing collapsed descriptions to two lines with ellipsis on desktop and mobile, including completed items after reload', async () => {
    const browser = await createBrowser()
    try {
        const id = await seed('Two line description E2E')
        await join(browser, id)
        await add(browser, 'Preview description')
        const toggle = 'button[aria-expanded]:not([aria-haspopup])'
        const selector = 'textarea[aria-label="Item description"]'
        for (const description of ['Short text', 'First line\nSecond line', 'First line\nSecond line\nThird line\nFourth line', 'unbroken'.repeat(80)]) {
            await browser.$(toggle).click()
            await setText(browser, selector, description)
            await browser.$(toggle).click()
            await settled(browser)
            expect(Object.values((await state(id)).items)[0]?.description).toBe(description)
            for (const completed of [false, true]) {
                if (completed) {
                    await browser.$('button[aria-label="Mark complete"]').click()
                    await settled(browser)
                }
                for (const width of [1280, 360]) {
                    await browser.setWindowSize(width, 1000)
                    await browser.refresh()
                    await browser.$('[data-testid="item-description-preview"]').waitForDisplayed()
                    const layout = await browser.execute(() => {
                        const preview = document.querySelector<HTMLElement>('[data-testid="item-description-preview"]')!
                        const style = getComputedStyle(preview)
                        return {
                            text: preview.textContent,
                            height: preview.getBoundingClientRect().height,
                            lineHeight: parseFloat(style.lineHeight),
                            clamp: style.webkitLineClamp,
                            orientation: style.webkitBoxOrient,
                            display: style.display,
                            overflow: style.overflow,
                            overflows: preview.scrollHeight > preview.clientHeight + 1,
                            fitsWidth: preview.scrollWidth <= preview.clientWidth + 1,
                            pageFits: document.documentElement.scrollWidth <= window.innerWidth,
                        }
                    })
                    expect(layout.text).toBe(description)
                    expect(layout.height).toBeLessThanOrEqual(layout.lineHeight * 2 + 1)
                    // Chromium's native two-line clamp paints an ellipsis only on overflow.
                    expect(layout.clamp).toBe('2')
                    expect(layout.orientation).toBe('vertical')
                    expect(['-webkit-box', 'flow-root']).toContain(layout.display)
                    expect(layout.overflow).toBe('hidden')
                    expect(layout.overflows).toBe(description.length > 40)
                    if (description === 'Short text') expect(layout.height).toBe(layout.lineHeight)
                    if (description === 'First line\nSecond line') expect(layout.height).toBe(layout.lineHeight * 2)
                    expect(layout.fitsWidth).toBe(true)
                    expect(layout.pageFits).toBe(true)
                    await browser.$(toggle).click()
                    expect(await browser.$(selector).getValue()).toBe(description)
                    expect(await browser.$(selector).isEnabled()).toBe(!completed)
                    expect(await browser.execute(() => {
                        const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Item description"]')!
                        return textarea.scrollHeight <= textarea.clientHeight + 1
                    })).toBe(true)
                    await browser.$(toggle).click()
                }
            }
            await browser.$('button[aria-label="Mark incomplete"]').click()
            await settled(browser)
        }
    } finally { await closeBrowser(browser) }
})

it('autosizes expanded descriptions on opening, viewport resize, edits and completion without clipping details', async () => {
    const browser = await createBrowser()
    try {
        const id = await seed('Editable full description E2E')
        await join(browser, id)
        await add(browser, 'Read and edit every line')
        const toggle = 'button[aria-expanded]:not([aria-haspopup])'
        const selector = 'textarea[aria-label="Item description"]'
        const description = Array.from({ length: 35 }, (_, i) => `Line ${i + 1}: a long description that should wrap when the viewport becomes narrow.`).join('\n')
        const layout = () => browser.execute(() => {
            const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Item description"]')!
            const details = textarea.parentElement!.parentElement!
            const card = details.parentElement!
            const textareaRect = textarea.getBoundingClientRect()
            const footerRect = details.lastElementChild!.getBoundingClientRect()
            const cardRect = card.getBoundingClientRect()
            return {
                height: textareaRect.height,
                fits: textarea.scrollHeight <= textarea.clientHeight + 1 && textarea.scrollWidth <= textarea.clientWidth + 1,
                contained: textareaRect.bottom <= cardRect.bottom && footerRect.bottom <= cardRect.bottom + 1,
                pageFits: document.documentElement.scrollWidth <= window.innerWidth,
            }
        })
        const expectFullHeight = async () => {
            await browser.waitUntil(async () => {
                const result = await layout()
                return result.fits && result.contained && result.pageFits
            }, { timeout: 5000, timeoutMsg: 'Full textarea content and details footer must fit without internal scrolling or clipping' })
            return (await layout()).height
        }

        await browser.$(toggle).click()
        await setText(browser, selector, description)
        const desktopHeight = await expectFullHeight()
        expect(desktopHeight).toBeGreaterThan(700)
        await browser.$(toggle).click()
        await settled(browser)
        expect(Object.values((await state(id)).items)[0]?.description).toBe(description)
        await browser.refresh()
        await browser.$('[data-testid="item-description-preview"]').waitForDisplayed()
        await browser.$(toggle).click()
        expect(await browser.$(selector).getValue()).toBe(description)
        await expectFullHeight()

        await browser.setWindowSize(360, 1000)
        const narrowHeight = await expectFullHeight()
        expect(narrowHeight).toBeGreaterThan(desktopHeight)
        await browser.setWindowSize(1280, 1000)
        await browser.waitUntil(async () => (await layout()).height < narrowHeight)
        await expectFullHeight()
        await setText(browser, selector, description + '\n' + description)
        expect(await expectFullHeight()).toBeGreaterThan(desktopHeight)
        await setText(browser, selector, 'Short description')
        await browser.waitUntil(async () => (await layout()).height < desktopHeight)
        expect(await expectFullHeight()).toBeLessThan(120)
        await setText(browser, selector, description)
        await expectFullHeight()
        await browser.$(toggle).click()
        await settled(browser)
        await browser.$('button[aria-label="Mark complete"]').click()
        await settled(browser)
        await browser.$(toggle).click()
        expect(await browser.$(selector).isEnabled()).toBe(false)
        expect(await browser.$(selector).getValue()).toBe(description)
        await expectFullHeight()
        await browser.setWindowSize(360, 1000)
        await expectFullHeight()
        await browser.refresh()
        await browser.$('[data-testid="item-description-preview"]').waitForDisplayed()
        await browser.$(toggle).click()
        expect(await browser.$(selector).isEnabled()).toBe(false)
        await expectFullHeight()
    } finally { await closeBrowser(browser) }
})
