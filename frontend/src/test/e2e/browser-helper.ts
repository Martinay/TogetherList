import { remote } from 'webdriverio'
import type { Capabilities } from '@wdio/types'

const BASE_URL = 'http://localhost:5173'

const defaultOptions: Capabilities.WebdriverIOConfig = {
    capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--headless', '--no-sandbox', '--disable-gpu'],
        },
    },
    logLevel: 'warn',
}

/**
 * Create a WebdriverIO browser session configured for headless Chrome.
 */
export async function createBrowser(options?: Partial<Capabilities.WebdriverIOConfig>) {
    return remote({ ...defaultOptions, ...options })
}

export { BASE_URL }
