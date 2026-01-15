import { useTranslation } from 'react-i18next'

interface GreetingProps {
    /** The name of the current user */
    name: string
    /** Callback when the greeting is clicked (to switch user) */
    onClick: () => void
}

/**
 * Premium greeting component to show the user's identity.
 * Displays "Hello, [Name]!" with a beautiful gradient effect.
 */
function Greeting({ name, onClick }: GreetingProps) {
    const { t } = useTranslation()

    return (
        <div className="greeting" onClick={onClick} role="button" tabIndex={0}>
            <span className="greeting__text">
                {t('list.greeting.hello')}
                <span className="greeting__name">{name}</span>
                {t('list.greeting.suffix')}
            </span>
            <span className="greeting__hint">{t('list.greeting.switchHint')}</span>
        </div>
    )
}

export default Greeting
