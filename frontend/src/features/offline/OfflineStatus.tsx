import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { discardFailed, failedEdits, supportsOfflineEdits, offlineEvent, replay, retryFailed, syncStatus } from './store'

export default function OfflineStatus() {
    const { t } = useTranslation()
    const [status, setStatus] = useState(() => { try { return syncStatus() } catch { return { pending: 0, failed: false, offline: !navigator.onLine, unavailable: false } } })
    const [storageError, setStorageError] = useState(false)
    useEffect(() => {
        const update = () => { try { setStatus(syncStatus()) } catch { setStorageError(true) } }
        const storageFailed = () => setStorageError(true)
        window.addEventListener('togetherlist:storage-error', storageFailed)
        const sync = () => { update(); void replay().catch(() => setStorageError(true)) }
        window.addEventListener('online', sync)
        window.addEventListener('offline', update)
        window.addEventListener('storage', update)
        window.addEventListener(offlineEvent, update)
        sync()
        const timer = setInterval(sync, 3000)
        return () => {
            clearInterval(timer)
            window.removeEventListener('togetherlist:storage-error', storageFailed)
            window.removeEventListener('online', sync)
            window.removeEventListener('offline', update)
            window.removeEventListener('storage', update)
            window.removeEventListener(offlineEvent, update)
        }
    }, [])
    if (supportsOfflineEdits() && !status.offline && !status.pending && !status.unavailable && !storageError) return null
    return <div role="status" className="bg-bg-secondary text-text-primary px-4 py-3 text-center text-sm">
        {!supportsOfflineEdits() ? t('offline.unsupported') : storageError ? t('offline.storageError') : status.failed ? t('offline.failed') : status.offline ? t('offline.offline') : status.unavailable ? t('list.error') : t('offline.syncing')}
        {status.pending > 0 && <span> {t('offline.pending', { count: status.pending })}</span>}
        {status.failed && <details className="mt-2"><summary>{t('offline.review')}</summary>{failedEdits().map(edit => <div key={edit.id} className="mt-2"><strong>{edit.list}</strong><div>{t('offline.rejected', { status: edit.status })}: {edit.detail === 'offline.fieldConflict' ? t(edit.detail) : edit.detail}</div><div>{t('offline.savedValue')}: {String(Array.isArray(edit.local) ? edit.local.join(', ') : edit.local ?? '—')}</div><div>{t('offline.serverValue')}: {String(Array.isArray(edit.remote) ? edit.remote.join(', ') : edit.remote ?? '—')}</div><p>{t('offline.recovery')}</p><button className="underline" onClick={() => { if (window.confirm(t('offline.discardConfirm'))) void discardFailed(edit.listId, edit.id).catch(() => setStorageError(true)) }}>{t('offline.discard')}</button></div>)}</details>}
        {status.failed && failedEdits().some(edit => edit.status === 409) && <button className="underline ml-3" onClick={() => { void retryFailed().catch(() => setStorageError(true)) }}>{t('offline.retry')}</button>}
    </div>
}
