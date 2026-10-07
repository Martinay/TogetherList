import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import OfflineStatus from './features/offline/OfflineStatus'
import LandingPage from './features/create-list/LandingPage'
import ListPage from './features/view-list/ListPage'
import CreateListPage from './features/create-list/CreateListPage'

import PrivacyControls from './features/privacy/privacy-controls'
import PrivacyPage from './features/privacy/privacy-page'

function App() {
    const { i18n } = useTranslation()

    useEffect(() => {
        const rtlLanguages = ['ar']
        const currentLang = i18n.resolvedLanguage || i18n.language || 'en'
        document.documentElement.dir = rtlLanguages.includes(currentLang) ? 'rtl' : 'ltr'
    }, [i18n.language, i18n.resolvedLanguage])

    return (
        <>
        <OfflineStatus />
        <Routes>
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/list/new" element={<CreateListPage />} />
            <Route path="/list/:id" element={<ListPage />} />
        </Routes>
        <PrivacyControls />
        </>
    )
}

export default App
