import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clarityLoaded, clearClarityCookies, consentKey, loadClarity, readConsent, revokeClarity, saveConsent, safeCurrentLanding } from './clarity'

export default function PrivacyControls() {
    const { t } = useTranslation()
    const [consent, setConsent] = useState(readConsent)
    const [error, setError] = useState(false)
    useEffect(() => {
        loadClarity()
        const sync = () => {
            const next = readConsent()
            setConsent(next)
            if (next !== 'accepted' || !safeCurrentLanding()) revokeClarity()
            else loadClarity()
        }
        const storage = (event: StorageEvent) => { if (event.key === consentKey || event.key === null || event.key?.startsWith('togetherlist:offline:')) sync() }
        window.addEventListener('storage', storage)
        return () => window.removeEventListener('storage', storage)
    }, [])
    const choose = (value: 'accepted' | 'declined') => {
        const saved = saveConsent(value)
        setError(!saved)
        setConsent(saved ? value : null)
        if (value === 'declined') {
            clearClarityCookies()
            // If persistence fails, reload would restore a stale acceptance.
            // Fail closed for this document instead of reloading in that case.
            if (!saved && clarityLoaded()) {
                window.clarity?.('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' })
                window.clarity?.('stop')
                window.location.replace('/privacy')
            } else revokeClarity()
        } else if (saved) loadClarity()
    }
    return <footer className="relative z-10 mx-auto w-full max-w-[900px] p-6 text-sm text-text-secondary" aria-label={t('privacy.title')}>
        <p>{t('privacy.disclosure')} <a className="underline text-text-primary decoration-accent-primary" href="/privacy" referrerPolicy="no-referrer">{t('privacy.title')}</a></p>
        <p className="my-2" aria-live="polite">{t(consent === 'accepted' ? 'privacy.accepted' : consent === 'declined' ? 'privacy.declined' : 'privacy.pending')}</p>
        <div className="flex flex-wrap gap-3">
            <button className="rounded-lg border border-border-light bg-bg-card px-4 py-2 text-text-primary cursor-pointer" onClick={() => choose('accepted')}>{t('privacy.accept')}</button>
            <button className="rounded-lg border border-border-light bg-bg-card px-4 py-2 text-text-primary cursor-pointer" onClick={() => choose('declined')}>{t('privacy.decline')}</button>
        </div>
        {error && <p role="alert" className="mt-2">{t('privacy.storageError')}</p>}
    </footer>
}
