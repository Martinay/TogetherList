import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

interface EnterNameStepProps {
    onNext: (name: string) => void
}

export function EnterNameStep({ onNext }: EnterNameStepProps) {
    const { t } = useTranslation()
    const [name, setName] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onNext(name.trim())
        }
    }

    return (
        <motion.form
            className="wizard__step"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="wizard__title">{t('createList.step1Title')}</h2>
            <input
                id="creator-name-input"
                type="text"
                className="wizard__input"
                placeholder={t('createList.step1Placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
            />
            <button
                id="step1-next-button"
                type="submit"
                className="wizard__button"
                disabled={!name.trim()}
            >
                {t('createList.step1Next')}
            </button>
        </motion.form>
    )
}

interface AddParticipantsStepProps {
    creatorName: string
    onBack: () => void
    onCreate: (participants: string[]) => void
    isCreating?: boolean
}

export function AddParticipantsStep({ creatorName, onBack, onCreate, isCreating = false }: AddParticipantsStepProps) {
    const { t } = useTranslation()
    const [participants, setParticipants] = useState<string[]>([])
    const [newParticipant, setNewParticipant] = useState('')
    const [error, setError] = useState('')

    const isDuplicate = (name: string): boolean => {
        const trimmed = name.trim()
        return trimmed === creatorName || participants.includes(trimmed)
    }

    const handleAdd = () => {
        const trimmed = newParticipant.trim()
        if (!trimmed) return

        if (isDuplicate(trimmed)) {
            setError(t('createList.duplicateError'))
            return
        }

        setParticipants([...participants, trimmed])
        setNewParticipant('')
        setError('')
    }

    const handleRemove = (name: string) => {
        setParticipants(participants.filter(p => p !== name))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
        }
    }

    const handleCreate = () => {
        onCreate(participants)
    }

    return (
        <motion.div
            className="wizard__step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="wizard__title">{t('createList.step2Title')}</h2>

            <div className="wizard__participant-list">
                <div className="wizard__participant-item wizard__participant-item--creator">
                    <span>{creatorName}</span>
                    <span className="wizard__participant-badge">{t('createList.you')}</span>
                </div>
                {participants.map((name) => (
                    <div key={name} className="wizard__participant-item">
                        <span>{name}</span>
                        <button
                            type="button"
                            className="wizard__remove-button"
                            onClick={() => handleRemove(name)}
                            aria-label={`Remove ${name}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="wizard__add-row">
                <input
                    id="participant-name-input"
                    type="text"
                    className={`wizard__input${error ? ' wizard__input--error' : ''}`}
                    placeholder={t('createList.step2Placeholder')}
                    value={newParticipant}
                    onChange={(e) => {
                        setNewParticipant(e.target.value)
                        if (error) setError('')
                    }}
                    onKeyDown={handleKeyDown}
                />
                <button
                    id="add-participant-button"
                    type="button"
                    className="wizard__add-button"
                    onClick={handleAdd}
                    disabled={!newParticipant.trim()}
                >
                    {t('createList.step2Add')}
                </button>
            </div>
            {error && <p className="wizard__error">{error}</p>}

            <div className="wizard__actions">
                <button
                    id="back-button"
                    type="button"
                    className="wizard__button wizard__button--secondary"
                    onClick={onBack}
                    disabled={isCreating}
                >
                    {t('createList.back')}
                </button>
                <button
                    id="create-list-button"
                    type="button"
                    className="wizard__button"
                    onClick={handleCreate}
                    disabled={isCreating}
                >
                    {isCreating ? t('createList.creating') : t('createList.step2Create')}
                </button>
            </div>
        </motion.div>
    )
}
