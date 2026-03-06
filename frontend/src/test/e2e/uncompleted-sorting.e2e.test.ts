import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Browser } from 'webdriverio'
import { createBrowser, BASE_URL } from './browser-helper'

describe('Uncompleted item sorting', () => {
    let browser: Browser

    beforeAll(async () => {
        browser = await createBrowser()
    })

    afterAll(async () => {
        if (browser) {
            await browser.deleteSession()
        }
    })

    async function createListAndOpen(): Promise<void> {
        await browser.url(BASE_URL)
        const createButton = await browser.$('button=Create New List')
        await createButton.waitForDisplayed({ timeout: 5_000 })
        await createButton.click()

        const listNameInput = await browser.$('input[placeholder="e.g., Weekend Trip"]')
        await listNameInput.waitForDisplayed({ timeout: 5_000 })
        await listNameInput.setValue('Sort E2E List')
        await (await browser.$('button=Continue')).click()

        const nameInput = await browser.$('input[placeholder="Enter your name"]')
        await nameInput.waitForDisplayed({ timeout: 5_000 })
        await nameInput.setValue('SortUser')
        await (await browser.$('button=Continue')).click()

        const createListButton = await browser.$('button=Create List')
        await createListButton.waitForDisplayed({ timeout: 5_000 })
        await createListButton.click()

        const identityButton = await browser.$('button=SortUser')
        await identityButton.waitForDisplayed({ timeout: 5_000 })
        await identityButton.click()

        const addInput = await browser.$('input[placeholder="What needs to be done?"]')
        await addInput.waitForDisplayed({ timeout: 5_000 })
    }

    async function addItem(title: string): Promise<void> {
        const addInput = await browser.$('input[placeholder="What needs to be done?"]')
        await addInput.setValue(title)
        await (await browser.$('button=Add')).click()
        await (await browser.$(`span=${title}`)).waitForDisplayed({ timeout: 5_000 })
    }

    async function setSortMode(label: string): Promise<void> {
        const sortSelect = await browser.$('select[aria-label="Sort"]')
        await sortSelect.waitForDisplayed({ timeout: 5_000 })
        await sortSelect.selectByVisibleText(label)
    }

    async function toggleItem(title: string): Promise<void> {
        const row = await browser.$(`//span[normalize-space()="${title}"]/ancestor::div[contains(@class,"rounded-xl")][1]`)
        const checkbox = await row.$('button[aria-label="Mark complete"], button[aria-label="Mark incomplete"]')
        await checkbox.waitForDisplayed({ timeout: 5_000 })
        await checkbox.click()
    }

    async function activeItemOrder(titles: string[]): Promise<string[]> {
        const completedHeading = await browser.$('h2*=Completed')
        const hasCompleted = await completedHeading.isExisting()

        const positions: Array<{ title: string, y: number }> = []

        for (const title of titles) {
            const el = await browser.$(`//span[normalize-space()="${title}"]`)
            await el.waitForDisplayed({ timeout: 5_000 })
            const y = (await el.getLocation()).y

            if (!hasCompleted) {
                positions.push({ title, y })
                continue
            }

            const completedY = (await completedHeading.getLocation()).y
            if (y < completedY) {
                positions.push({ title, y })
            }
        }

        return positions.sort((a, b) => a.y - b.y).map(entry => entry.title)
    }

    async function completedItemOrder(titles: string[]): Promise<string[]> {
        const completedHeading = await browser.$('h2*=Completed')
        await completedHeading.waitForDisplayed({ timeout: 5_000 })
        const completedY = (await completedHeading.getLocation()).y

        const positions: Array<{ title: string, y: number }> = []
        for (const title of titles) {
            const el = await browser.$(`//span[normalize-space()="${title}"]`)
            await el.waitForDisplayed({ timeout: 5_000 })
            const y = (await el.getLocation()).y
            if (y > completedY) {
                positions.push({ title, y })
            }
        }

        return positions.sort((a, b) => a.y - b.y).map(entry => entry.title)
    }

    it('supports uncompleted sorting modes, persists after reload, and keeps completed section behavior', async () => {
        await createListAndOpen()

        await addItem('zebra')
        await addItem('apple')
        await addItem('banana')

        // Default mode is newest first
        expect(await activeItemOrder(['zebra', 'apple', 'banana'])).toEqual(['banana', 'apple', 'zebra'])

        // Alphabetical sort in uncompleted section
        await setSortMode('A–Z')
        expect(await activeItemOrder(['zebra', 'apple', 'banana'])).toEqual(['apple', 'banana', 'zebra'])

        // Persist sort mode after reload
        await browser.refresh()
        await (await browser.$('input[placeholder="What needs to be done?"]')).waitForDisplayed({ timeout: 5_000 })
        expect(await activeItemOrder(['zebra', 'apple', 'banana'])).toEqual(['apple', 'banana', 'zebra'])

        // Move two items to completed section and verify completed order remains based on completion time
        await toggleItem('zebra')
        await browser.pause(1_100)
        await toggleItem('apple')

        const completedBeforeSortChange = await completedItemOrder(['zebra', 'apple'])
        expect(completedBeforeSortChange).toEqual(['apple', 'zebra'])

        await setSortMode('Z–A')

        // Active sorting changes
        expect(await activeItemOrder(['banana'])).toEqual(['banana'])

        // Completed section should stay unchanged
        const completedAfterSortChange = await completedItemOrder(['zebra', 'apple'])
        expect(completedAfterSortChange).toEqual(['apple', 'zebra'])
    })
})
