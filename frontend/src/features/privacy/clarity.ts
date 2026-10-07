export const consentKey = 'togetherlist:clarity-consent:v1'
export type Consent = 'accepted' | 'declined' | null

type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] }
declare global { interface Window { clarity?: Clarity } }

export function readConsent(): Consent {
    try {
        const value = localStorage.getItem(consentKey)
        return value === 'accepted' || value === 'declined' ? value : null
    } catch { return null }
}

export function saveConsent(value: Exclude<Consent, null>): boolean {
    try { localStorage.setItem(consentKey, value); return true } catch {
        // Quota failures can still permit removing a stale grant.
        if (value === 'declined') { try { localStorage.removeItem(consentKey) } catch { /* Storage unavailable. */ } }
        return false
    }
}

// Masking does not protect URL/referrer/click targets. Only a fresh public
// document without saved-list links can host the recorder; never a SPA return.
export function safeLanding(url: string, referrer: string, storage: Storage): boolean {
    try {
        const page = new URL(url)
        if (page.pathname !== '/' || page.search || page.hash) return false
        if (referrer) {
            const previous = new URL(referrer)
            if (previous.origin !== page.origin || !['/', '/privacy'].includes(previous.pathname) || previous.search || previous.hash) return false
        }
        return !Object.keys(storage).some(key => key.startsWith('togetherlist:offline:'))
    } catch { return false }
}

export function safeCurrentLanding(): boolean {
    try { return safeLanding(location.href, document.referrer, localStorage) } catch { return false }
}
const publicDocument = safeCurrentLanding()
let loaded = false
export function loadClarity(): void {
    if (!import.meta.env.PROD || import.meta.env.MODE !== 'production' || !publicDocument || readConsent() !== 'accepted' || loaded) return
    // Recheck immediately before loading in case another tab saved a list.
    if (!safeCurrentLanding()) return
    loaded = true
    const clarity: Clarity = (...args) => { clarity.q!.push(args) }
    clarity.q = []
    window.clarity = clarity
    clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' })
    const script = document.createElement('script')
    script.id = 'togetherlist-clarity'
    script.async = true
    script.referrerPolicy = 'no-referrer'
    script.src = 'https://www.clarity.ms/tag/yu06fgkw31'
    document.head.append(script)
}

export function clearClarityCookies(): void {
    try {
        for (const name of ['_clck', '_clsk']) {
            document.cookie = `${name}=; Max-Age=0; Path=/`
            const parts = location.hostname.split('.')
            for (let i = 0; i < parts.length - 1; i++) {
                document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${parts.slice(i).join('.')}`
            }
        }
    } catch { /* Cookie storage may be disabled; the SDK document is still terminated. */ }
}

export function revokeClarity(): void {
    clearClarityCookies()
    if (!loaded) return
    window.clarity?.('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' })
    window.clarity?.('stop')
    // End the entire document: denial alone permits cookieless tracking.
    location.reload()
}

export function clarityLoaded(): boolean { return loaded }
