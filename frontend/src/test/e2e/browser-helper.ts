import { remote, type Browser } from 'webdriverio'
import type { Capabilities } from '@wdio/types'
import { writeFile } from 'node:fs/promises'

export const BASE_URL = 'http://localhost:5173'
export const sessions = new Set<Browser>()
export async function capture(browser: Browser, name: string) {
    if (!browser.sessionId) return
    await browser.saveScreenshot(`e2e-artifacts/${name}.png`)
    await writeFile(`e2e-artifacts/${name}.html`, await browser.getPageSource())
    await writeFile(`e2e-artifacts/${name}-console.json`, JSON.stringify(await browser.getLogs('browser'), null, 2))
}
export async function createBrowser(options?: Partial<Capabilities.WebdriverIOConfig>, consentFixture: 'declined' | null = 'declined') {
    const capabilities = options?.capabilities as WebdriverIO.Capabilities | undefined
    const chrome = capabilities?.['goog:chromeOptions'] || {}
    const browser = await remote({
        ...options, hostname: 'localhost', port: 19517, logLevel: 'error',
        capabilities: {
            ...capabilities, browserName: 'chrome', 'wdio:enforceWebDriverClassic': true, 'goog:loggingPrefs': { browser: 'ALL' },
            'goog:chromeOptions': {
                args: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1280,1000'],
                ...chrome,
                ...(process.env.CHROME_BINARY ? { binary: process.env.CHROME_BINARY } : {}),
            },
        } as WebdriverIO.Capabilities,
    })
    await browser.setTimeout({ pageLoad: 20000, script: 10000, implicit: 0 })
    await cdp(browser, 'Network.enable')
    // External typography is not part of the local application integration boundary.
    await cdp(browser, 'Network.setBlockedURLs', { urls: ['*://fonts.googleapis.com/*', '*://fonts.gstatic.com/*'] })
    if (consentFixture) await cdp(browser, 'Page.addScriptToEvaluateOnNewDocument', { source: `if (location.origin === '${BASE_URL}' && !localStorage.getItem('togetherlist:clarity-consent:v1')) localStorage.setItem('togetherlist:clarity-consent:v1', 'declined')` })
    sessions.add(browser)
    return browser
}
export async function cdp(browser: Browser, cmd: string, params: Record<string, unknown> = {}) {
    if (cmd === 'Network.setBlockedURLs') {
        params = { ...params, urls: [...(params.urls as string[] || []), '*://fonts.googleapis.com/*', '*://fonts.gstatic.com/*'] }
    }
    const response = await fetch(`http://localhost:19517/session/${browser.sessionId}/goog/cdp/execute`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cmd, params }),
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
}

export async function closeBrowser(browser: Browser) {
    try { await capture(browser, `session-${browser.sessionId}`) }
    catch (error) { process.stderr.write(`Artifact capture failed: ${error}\n`) }
    finally { sessions.delete(browser); await browser.deleteSession() }
}

export async function setText(browser: Browser, selector: string, text: string) {
    const input = await browser.$(selector)
    await input.waitForDisplayed()
    await input.click()
    await browser.keys(['Control', 'a'])
    await cdp(browser, 'Input.insertText', { text })
}
