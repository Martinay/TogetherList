import { clarityLoaded } from '../privacy/clarity'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { offlineEvent, storedLists } from './store'

export default function StoredLists() {
    const { t } = useTranslation()
    const [lists, setLists] = useState(() => { try { return storedLists() } catch { return [] } })
    useEffect(() => {
        const update = () => { try { setLists(storedLists()) } catch { /* Storage failure is shown by OfflineStatus. */ } }
        window.addEventListener(offlineEvent, update)
        window.addEventListener('storage', update)
        return () => { window.removeEventListener(offlineEvent, update); window.removeEventListener('storage', update) }
    }, [])
    if (clarityLoaded() || !lists.length) return null
    return <section className="relative z-10 rounded-xl bg-bg-card p-5 my-6 max-w-[600px] w-full">
        <h2 className="font-semibold mb-2">{t('offline.savedLists')}</h2>
        <ul>{lists.map(list => <li key={list.id}><Link className="text-accent-primary underline" to={`/list/${encodeURIComponent(list.id)}`}>{list.name}</Link></li>)}</ul>
    </section>
}
