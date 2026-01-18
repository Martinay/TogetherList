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
        <div
            className="text-center mb-6 cursor-pointer relative flex flex-col items-center gap-1 group"
            onClick={onClick}
            role="button"
            tabIndex={0}
        >
            <span className="text-[clamp(1.5rem,4vw,2rem)] font-bold text-text-primary leading-tight">
                {t('list.greeting.hello')}
                <span className="bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent inline-block px-[0.2em] group-hover:drop-shadow-[0_2px_10px_var(--color-accent-glow)]">
                    {name}
                </span>
                {t('list.greeting.suffix')}
            </span>
            <span className="text-xs text-text-secondary opacity-0 -translate-y-1 transition-all duration-250 font-medium group-hover:opacity-70 group-hover:translate-y-0">
                {t('list.greeting.switchHint')}
            </span>
        </div>
    )
}

export default Greeting
