import { describe, it, expect } from 'vitest'
import { createBrowser, BASE_URL } from './browser-helper'

const SUPPORTED_LANGUAGES = [
    'en', 'ar', 'hi', 'es', 'fr', 'bn', 'pt', 'id', 'ru', 'de', 
    'ja', 'tr', 'vi', 'it', 'pl', 'uk', 'nl', 'el', 'hu', 'sv', 'cs'
];

describe('Language Support Core Features', () => {

    it('falls back to English when an unsupported browser language is used', async () => {
        const browser = await createBrowser({
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['--headless', '--no-sandbox', '--disable-gpu', '--lang=xx-XX'],
                    prefs: {
                        'intl.accept_languages': 'xx-XX'
                    }
                },
            }
        })
        try {
            await browser.url(BASE_URL)
            // Wait for hydration/suspense
            const select = await browser.$('select[aria-label="Select Language"]')
            await select.waitForDisplayed({ timeout: 5000 })
            const val = await select.getValue()
            expect(val).toBe('en')
        } finally {
            await browser.deleteSession()
        }
    })

    it('persists manual language selection in localStorage', async () => {
        const browser = await createBrowser()
        try {
            await browser.url(BASE_URL)
            const select = await browser.$('select[aria-label="Select Language"]')
            await select.waitForDisplayed({ timeout: 5000 })
            
            // Change language to Spanish
            await select.selectByAttribute('value', 'es')
            
            // Verify localStorage
            const storedLang = await browser.execute(() => window.localStorage.getItem('i18nextLng'))
            expect(storedLang).toBe('es')
            
            // Reload and verify persistence
            await browser.url(BASE_URL)
            const newSelect = await browser.$('select[aria-label="Select Language"]')
            await newSelect.waitForDisplayed({ timeout: 5000 })
            expect(await newSelect.getValue()).toBe('es')

        } finally {
            await browser.deleteSession()
        }
    })

    it('sets RTL layout stability for Arabic', async () => {
        const browser = await createBrowser()
        try {
            await browser.url(BASE_URL)
            const select = await browser.$('select[aria-label="Select Language"]')
            await select.waitForDisplayed({ timeout: 5000 })
            
            // Change language to Arabic
            await select.selectByAttribute('value', 'ar')
            
            // Wait a tick for React to update DOM
            await browser.pause(500)
            
            // Check HTML dir attribute
            const dir = await browser.execute(() => document.documentElement.dir)
            expect(dir).toBe('rtl')
            
            // Switch back to English and check LTR
            await select.selectByAttribute('value', 'en')
            await browser.pause(500)
            const dirEn = await browser.execute(() => document.documentElement.dir)
            expect(dirEn).toBe('ltr')

        } finally {
            await browser.deleteSession()
        }
    })
})

describe('Browser Language Detection (all supported languages)', () => {
    // We launch a dedicated browser for each language to ensure detection works perfectly
    for (const lang of SUPPORTED_LANGUAGES) {
        it(`detects browser language: ${lang}`, async () => {
            const browser = await createBrowser({
                capabilities: {
                    browserName: 'chrome',
                    'goog:chromeOptions': {
                        args: ['--headless', '--no-sandbox', '--disable-gpu', `--lang=${lang}`, `--accept-lang=${lang}`],
                        prefs: {
                            'intl.accept_languages': lang
                        }
                    },
                }
            })
            try {
                // Clear any stored state just in case
                await browser.url(BASE_URL)
                await browser.execute(() => window.localStorage.clear())
                await browser.url(BASE_URL) // Reload with clean storage
                
                const select = await browser.$('select[aria-label="Select Language"]')
                await select.waitForDisplayed({ timeout: 5000 })
                
                const currentVal = await select.getValue()
                // Browsers might return dialect (e.g. 'en-US' for 'en') so i18next usually resolves the base.
                // Our detector is configured to fallback to the supported language.
                expect(currentVal).toBe(lang)
            } finally {
                await browser.deleteSession()
            }
        })
    }
})
