import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './privacy-controls.css'
import { clarityLoaded, clearClarityCookies, consentKey, loadClarity, readConsent, revokeClarity, saveConsent, safeCurrentLanding } from './clarity'

export default function PrivacyControls() {
    const { t } = useTranslation()
    const [consent, setConsent] = useState(readConsent)
    const [error, setError] = useState(false)
    const footerChoice = useRef<HTMLButtonElement>(null)
    const restoreFocus = useRef(false)
    useEffect(() => {
        if (consent && restoreFocus.current) {
            footerChoice.current?.focus()
            restoreFocus.current = false
        }
    }, [consent])
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
        restoreFocus.current = saved
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
    const actions = <div className="privacy-actions">
        <button ref={consent ? footerChoice : undefined} className="privacy-allow" onClick={() => choose('accepted')}>{t('privacy.accept')}</button>
        <button onClick={() => choose('declined')}>{t('privacy.decline')}</button>
    </div>
    const policy = <a href="/privacy" referrerPolicy="no-referrer">{t('privacy.title')}</a>
    return <>
        <footer className="privacy-footer" aria-label={t('privacy.title')}>
            <p>{policy}</p>
            <p aria-live="polite">{t(consent === 'accepted' ? 'privacy.accepted' : consent === 'declined' ? 'privacy.declined' : 'privacy.pending')}</p>
            {consent && actions}
        </footer>
        {!consent && <section className="privacy-banner" role="dialog" aria-labelledby="consent-title" aria-describedby="consent-description">
            <button className="privacy-close" aria-label={t('privacy.close')} onClick={() => choose('declined')}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
            <div className="privacy-copy">
                <h2 id="consent-title">{t('privacy.title')}</h2>
                <p id="consent-description">{t('privacy.disclosure')} {policy}</p>
            </div>
            {actions}
            {error && <p role="alert" className="privacy-error">{t('privacy.storageError')}</p>}
        </section>}
    </>
}
