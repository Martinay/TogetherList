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
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Radial glow background */}
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_50%)] opacity-60 animate-pulse" />

            <div className="relative z-10 max-w-[600px]">
                <motion.h1
                    className="text-[clamp(2.5rem,8vw,4rem)] font-extrabold bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent mb-4 tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {t('landing.title')}
                </motion.h1>

                <motion.p
                    className="text-[clamp(1rem,3vw,1.25rem)] text-text-secondary mb-12 font-medium"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    {t('landing.subtitle')}
                </motion.p>

                <motion.button
                    id="create-list-button"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full cursor-pointer transition-all duration-250 shadow-[0_4px_12px_var(--color-accent-glow)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_16px_var(--color-accent-glow)] active:translate-y-0 active:scale-[0.98]"
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
                    className="flex gap-8 mt-12 flex-wrap justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                        <svg className="w-5 h-5 text-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>{t('landing.features.noAuth')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                        <svg className="w-5 h-5 text-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        <span>{t('landing.features.realtime')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                        <svg className="w-5 h-5 text-accent-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
