import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { safeLanding, consentKey, readConsent, saveConsent } from '../features/privacy/clarity'
beforeEach(() => { localStorage.clear(); vi.restoreAllMocks() })
afterEach(() => { vi.unstubAllEnvs(); document.getElementById('togetherlist-clarity')?.remove(); delete window.clarity })
it('fails closed for private routes, URL tokens, private/external referrers and saved-list links', () => {
    const clean = 'https://togetherlist.eu/'
    expect(safeLanding(clean, '', localStorage)).toBe(true)
    expect(safeLanding(clean, 'https://togetherlist.eu/privacy', localStorage)).toBe(true)
    for (const path of ['/list/new', '/list/secret', '/privacy', '/?token=secret', '/#secret']) expect(safeLanding(new URL(path, clean).href, '', localStorage)).toBe(false)
    for (const ref of ['https://togetherlist.eu/list/secret', 'https://elsewhere.test/', 'https://togetherlist.eu/?secret', 'invalid']) expect(safeLanding(clean, ref, localStorage)).toBe(false)
    localStorage.setItem('togetherlist:offline:v1:secret', '{}')
    expect(safeLanding(clean, '', localStorage)).toBe(false)
})
it('persists only explicit choices and handles unavailable storage', () => {
    localStorage.setItem(consentKey, 'yes')
    expect(readConsent()).toBe(null)
    expect(saveConsent('declined')).toBe(true)
    expect(readConsent()).toBe('declined')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(saveConsent('accepted')).toBe(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(readConsent()).toBe(null)
})
it('never loads analytics in development or E2E mode even after acceptance', async () => {
    localStorage.setItem(consentKey, 'accepted')
    for (const mode of ['development', 'test', 'e2e']) {
        vi.stubEnv('MODE', mode)
        vi.stubEnv('PROD', mode === 'e2e')
        const { loadClarity } = await import('../features/privacy/clarity')
        loadClarity()
        expect(document.querySelector('script[src*="clarity.ms"]')).toBe(null)
    }
})
it('loads the exact project only after consent, queues consentv2 with advertising denied, and loads once', async () => {
    vi.resetModules()
    vi.stubEnv('PROD', true); vi.stubEnv('MODE', 'production')
    window.history.replaceState({}, '', '/')
    const { loadClarity } = await import('../features/privacy/clarity')
    loadClarity()
    expect(window.clarity).toBeUndefined()
    localStorage.setItem(consentKey, 'accepted')
    loadClarity(); loadClarity()
    expect(document.querySelectorAll('script[src="https://www.clarity.ms/tag/yu06fgkw31"]')).toHaveLength(1)
    expect(window.clarity?.q).toEqual([['consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' }]])
    expect(document.getElementById('togetherlist-clarity')).toHaveProperty('referrerPolicy', 'no-referrer')
})
it('never activates after a SPA return from a private document', async () => {
    vi.resetModules(); vi.stubEnv('PROD', true); vi.stubEnv('MODE', 'production')
    window.history.replaceState({}, '', '/list/secret')
    localStorage.setItem(consentKey, 'accepted')
    const { loadClarity } = await import('../features/privacy/clarity')
    window.history.replaceState({}, '', '/')
    loadClarity()
    expect(window.clarity).toBeUndefined()
})
it('removes stale consent after quota failure during decline and clears first-party cookies', async () => {
    localStorage.setItem(consentKey, 'accepted')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(saveConsent('declined')).toBe(false)
    expect(readConsent()).toBe(null)
    document.cookie = '_clck=old; Path=/'
    document.cookie = '_clsk=old; Path=/'
    const { clearClarityCookies } = await import('../features/privacy/clarity')
    clearClarityCookies()
    expect(document.cookie).not.toContain('_clck')
    expect(document.cookie).not.toContain('_clsk')
})
