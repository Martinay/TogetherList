import { useTranslation } from 'react-i18next'

interface IdentityPickerProps {
    /** List of available participant names */
    participants: string[]
    /** Callback when a name is selected */
    onSelect: (name: string) => void
}

/**
 * Component that displays when user has no stored identity for a list.
 * Shows available participant names for selection.
 */
function IdentityPicker({ participants, onSelect }: IdentityPickerProps) {
    const { t } = useTranslation()

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Radial glow background */}
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,var(--color-accent-glow)_0%,transparent_50%)] opacity-60 animate-pulse" />

            <div className="relative z-10 w-full max-w-[400px] text-center">
                <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-bold bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent mb-2">
                    {t('identity.title')}
                </h2>
                <p className="text-text-secondary text-base mb-8">
                    {t('identity.subtitle')}
                </p>
                <div className="flex flex-col gap-2">
                    {participants.map((name) => (
                        <button
                            key={name}
                            className="px-6 py-4 text-base font-medium text-text-primary bg-bg-card border border-border-medium rounded-xl cursor-pointer transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-[0_4px_12px_var(--color-accent-glow)] active:translate-y-0 active:bg-creator-bg"
                            onClick={() => onSelect(name)}
                            type="button"
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default IdentityPicker
