import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../../components/LanguageSwitcher'
export default function PrivacyPage() {
    const { t } = useTranslation()
    return <main className="relative mx-auto max-w-[900px] p-6 text-text-primary">
        <LanguageSwitcher />
        <h1 className="text-3xl font-bold my-6">{t('privacy.title')}</h1>
        <p className="mb-4 leading-relaxed">{t('privacy.statement')}</p>
        <p className="mb-4 leading-relaxed">{t('privacy.localData')}</p>
        <a className="underline text-text-primary decoration-accent-primary" href="https://privacy.microsoft.com/privacystatement" referrerPolicy="no-referrer">{t('privacy.microsoft')}</a>
        <p className="mt-4"><a className="underline text-text-primary decoration-accent-primary" href="/" referrerPolicy="no-referrer">{t('privacy.home')}</a></p>
    </main>
}
