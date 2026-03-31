import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'

const fadeIn = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
})

const FEATURE_ICONS: Record<string, string> = {
    noAuth: '🔓',
    realtime: '⚡',
    share: '🔗',
    assign: '👥',
    mobile: '📱',
    free: '💚',
}

const USE_CASE_ICONS: Record<string, string> = {
    shopping: '🛒',
    party: '🎉',
    trip: '🧳',
    potluck: '🍲',
    chores: '🏠',
    team: '📋',
}

function LandingPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleCreateList = () => {
        navigate('/list/new')
    }

    const featureKeys = ['noAuth', 'realtime', 'share', 'assign', 'mobile', 'free'] as const
    const useCaseKeys = ['shopping', 'party', 'trip', 'potluck', 'chores', 'team'] as const
    const faqKeys = ['1', '2', '3', '4', '5', '6', '7', '8'] as const
    const comparisonKeys = ['googleKeep', 'anyList', 'trello', 'appleReminders'] as const

    return (
        <main className="flex-1 flex flex-col items-center relative overflow-hidden">
            {/* Radial glow background */}
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_50%)] opacity-60 animate-pulse" />

            {/* Language Switcher */}
            <div className="absolute top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>

            {/* ─── HERO SECTION ─── */}
            <section id="hero" className="relative z-10 max-w-[700px] text-center px-6 pt-16 pb-12">
                <motion.p
                    className="text-accent-primary text-sm font-semibold uppercase tracking-widest mb-3"
                    {...fadeIn(0)}
                >
                    {t('landing.title')}
                </motion.p>
                <motion.h1
                    className="text-[clamp(2rem,6vw,3.25rem)] font-extrabold text-text-primary leading-tight mb-5 tracking-tight"
                    {...fadeIn(0.05)}
                >
                    {t('landing.headline')}
                </motion.h1>
                <motion.p
                    className="text-[clamp(1rem,3vw,1.2rem)] text-text-secondary mb-10 font-medium leading-relaxed"
                    {...fadeIn(0.1)}
                >
                    {t('landing.subtitle')}
                </motion.p>

                <motion.div className="flex flex-col items-center gap-2" {...fadeIn(0.15)}>
                    <motion.button
                        id="create-list-button"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full cursor-pointer transition-all duration-250 shadow-[0_4px_12px_var(--color-accent-glow)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_16px_var(--color-accent-glow)] active:translate-y-0 active:scale-[0.98]"
                        onClick={handleCreateList}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {t('landing.createButton')}
                    </motion.button>
                    <span className="text-text-secondary text-xs font-medium">{t('landing.createButtonSub')}</span>
                </motion.div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section id="how-it-works" className="relative z-10 w-full max-w-[900px] px-6 py-12">
                <motion.h2
                    className="text-2xl font-bold text-center text-text-primary mb-8"
                    {...fadeIn(0)}
                >
                    {t('landing.howItWorks.title')}
                </motion.h2>
                <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none">
                    {(['step1', 'step2', 'step3'] as const).map((step, i) => (
                        <motion.li
                            key={step}
                            className="relative bg-bg-card rounded-xl p-6 border border-border-light shadow-sm text-center"
                            {...fadeIn(0.1 * i)}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                                {i + 1}
                            </div>
                            <h3 className="font-semibold text-text-primary mb-2">{t(`landing.howItWorks.${step}Title`)}</h3>
                            <p className="text-text-secondary text-sm">{t(`landing.howItWorks.${step}Desc`)}</p>
                        </motion.li>
                    ))}
                </ol>
            </section>

            {/* ─── FEATURES ─── */}
            <section id="features" className="relative z-10 w-full max-w-[900px] px-6 py-12">
                <motion.h2
                    className="text-2xl font-bold text-center text-text-primary mb-8"
                    {...fadeIn(0)}
                >
                    {t('landing.features.title')}
                </motion.h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {featureKeys.map((key, i) => (
                        <motion.div
                            key={key}
                            className="bg-bg-card rounded-xl p-5 border border-border-light shadow-sm"
                            {...fadeIn(0.05 * i)}
                        >
                            <div className="text-2xl mb-3">{FEATURE_ICONS[key]}</div>
                            <h3 className="font-semibold text-text-primary mb-2">{t(`landing.features.${key}`)}</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">{t(`landing.features.${key}Desc`)}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── USE CASES ─── */}
            <section id="use-cases" className="relative z-10 w-full max-w-[900px] px-6 py-12">
                <motion.h2
                    className="text-2xl font-bold text-center text-text-primary mb-8"
                    {...fadeIn(0)}
                >
                    {t('landing.useCases.title')}
                </motion.h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {useCaseKeys.map((key, i) => (
                        <motion.div
                            key={key}
                            className="bg-bg-card rounded-xl p-4 border border-border-light shadow-sm text-center"
                            {...fadeIn(0.05 * i)}
                        >
                            <div className="text-3xl mb-2">{USE_CASE_ICONS[key]}</div>
                            <h3 className="font-semibold text-text-primary text-sm mb-1">{t(`landing.useCases.${key}`)}</h3>
                            <p className="text-text-secondary text-xs">{t(`landing.useCases.${key}Desc`)}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── COMPARISON ─── */}
            <section id="comparison" className="relative z-10 w-full max-w-[700px] px-6 py-12">
                <motion.h2
                    className="text-2xl font-bold text-center text-text-primary mb-4"
                    {...fadeIn(0)}
                >
                    {t('landing.comparison.title')}
                </motion.h2>
                <motion.p
                    className="text-text-secondary text-center mb-6"
                    {...fadeIn(0.05)}
                >
                    {t('landing.comparison.intro')}
                </motion.p>
                <ul className="space-y-3 list-none">
                    {comparisonKeys.map((key, i) => (
                        <motion.li
                            key={key}
                            className="bg-bg-card rounded-lg p-4 border border-border-light text-text-secondary text-sm"
                            {...fadeIn(0.05 * i)}
                        >
                            {t(`landing.comparison.${key}`)}
                        </motion.li>
                    ))}
                </ul>
            </section>

            {/* ─── FAQ ─── */}
            <section id="faq" className="relative z-10 w-full max-w-[700px] px-6 py-12">
                <motion.h2
                    className="text-2xl font-bold text-center text-text-primary mb-8"
                    {...fadeIn(0)}
                >
                    {t('landing.faq.title')}
                </motion.h2>
                <div className="space-y-3">
                    {faqKeys.map((key, i) => (
                        <motion.details
                            key={key}
                            className="bg-bg-card rounded-lg border border-border-light overflow-hidden [&[open]_summary]:border-b [&[open]_summary]:border-border-light"
                            {...fadeIn(0.03 * i)}
                        >
                            <summary className="cursor-pointer px-5 py-4 font-medium text-text-primary text-sm hover:bg-bg-secondary transition-colors">
                                {t(`landing.faq.q${key}`)}
                            </summary>
                            <p className="px-5 py-4 text-text-secondary text-sm leading-relaxed">
                                {t(`landing.faq.a${key}`)}
                            </p>
                        </motion.details>
                    ))}
                </div>
            </section>

            {/* ─── BOTTOM CTA ─── */}
            <section id="bottom-cta" className="relative z-10 w-full max-w-[700px] px-6 py-12 text-center">
                <motion.p
                    className="text-text-secondary mb-6 text-sm leading-relaxed"
                    {...fadeIn(0)}
                >
                    {t('landing.footer.description')}
                </motion.p>
                <motion.button
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full cursor-pointer transition-all duration-250 shadow-[0_4px_12px_var(--color-accent-glow)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_8px_16px_var(--color-accent-glow)] active:translate-y-0 active:scale-[0.98]"
                    onClick={handleCreateList}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    {...fadeIn(0.05)}
                >
                    {t('landing.footer.cta')}
                </motion.button>
            </section>
        </main>
    )
}

export default LandingPage
