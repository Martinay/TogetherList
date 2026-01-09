import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'


function LandingPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleCreateList = () => {
        navigate('/list/new')
    }

    return (
        <main className="landing">
            <div className="landing__content">
                <motion.h1
                    className="landing__title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {t('landing.title')}
                </motion.h1>

                <motion.p
                    className="landing__subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    {t('landing.subtitle')}
                </motion.p>

                <motion.button
                    id="create-list-button"
                    className="landing__button"
                    onClick={handleCreateList}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {t('landing.createButton')}
                </motion.button>

                <motion.div
                    className="landing__features"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="landing__feature">
                        <svg className="landing__feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>{t('landing.features.noAuth')}</span>
                    </div>
                    <div className="landing__feature">
                        <svg className="landing__feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        <span>{t('landing.features.realtime')}</span>
                    </div>
                    <div className="landing__feature">
                        <svg className="landing__feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                        <span>{t('landing.features.share')}</span>
                    </div>
                </motion.div>
            </div>
        </main>
    )
}

export default LandingPage
