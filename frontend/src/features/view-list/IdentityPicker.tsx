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
        <div className="identity-picker">
            <div className="identity-picker__content">
                <h2 className="identity-picker__title">
                    {t('identity.title')}
                </h2>
                <p className="identity-picker__subtitle">
                    {t('identity.subtitle')}
                </p>
                <div className="identity-picker__list">
                    {participants.map((name) => (
                        <button
                            key={name}
                            className="identity-picker__button"
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
