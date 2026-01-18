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
            className="flex flex-col gap-6"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-bold bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent text-center">
                {t('createList.step1Title')}
            </h2>
            <input
                id="creator-name-input"
                type="text"
                className="p-4 text-base font-[inherit] bg-bg-card border border-border-medium rounded-xl text-text-primary outline-none transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)] placeholder:text-stone-400 focus:border-accent-primary focus:shadow-[0_0_0_3px_var(--color-accent-glow)]"
                placeholder={t('createList.step1Placeholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
            />
            <button
                id="step1-next-button"
                type="submit"
                className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full cursor-pointer transition-all duration-250 shadow-[0_4px_12px_var(--color-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_8px_24px_var(--color-accent-glow)]"
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
            className="flex flex-col gap-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
        >
            <h2 className="text-[clamp(1.5rem,5vw,2rem)] font-bold bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent text-center">
                {t('createList.step2Title')}
            </h2>

            {/* Participant list */}
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {/* Creator item (highlighted) */}
                <div className="flex items-center justify-between px-4 py-2 bg-creator-bg rounded-lg border border-[rgba(217,119,6,0.3)] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span>{creatorName}</span>
                    <span className="text-xs text-accent-primary font-semibold">{t('createList.you')}</span>
                </div>
                {/* Other participants */}
                {participants.map((name) => (
                    <div key={name} className="flex items-center justify-between px-4 py-2 bg-bg-card rounded-lg border border-border-light shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <span>{name}</span>
                        <button
                            type="button"
                            className="bg-transparent border-none text-text-secondary text-xl cursor-pointer px-2 transition-colors duration-150 hover:text-error"
                            onClick={() => handleRemove(name)}
                            aria-label={`Remove ${name}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            {/* Add participant row */}
            <div className="flex gap-2">
                <input
                    id="participant-name-input"
                    type="text"
                    className={`flex-1 p-4 text-base font-[inherit] bg-bg-card border rounded-xl text-text-primary outline-none transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)] placeholder:text-stone-400 focus:shadow-[0_0_0_3px_var(--color-accent-glow)] ${error ? 'border-error focus:shadow-[0_0_0_3px_var(--color-error-light)]' : 'border-border-medium focus:border-accent-primary'}`}
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
                    className="p-4 text-sm font-semibold text-accent-primary bg-bg-card border border-accent-primary rounded-xl cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:bg-accent-primary hover:enabled:text-white"
                    onClick={handleAdd}
                    disabled={!newParticipant.trim()}
                >
                    {t('createList.step2Add')}
                </button>
            </div>
            {error && <p className="text-sm text-error -mt-4">{error}</p>}

            {/* Action buttons */}
            <div className="flex gap-4 justify-between">
                <button
                    id="back-button"
                    type="button"
                    className="flex-1 px-8 py-4 text-base font-semibold text-text-secondary bg-transparent border border-border-medium rounded-full cursor-pointer transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:border-accent-primary hover:enabled:text-accent-primary"
                    onClick={onBack}
                    disabled={isCreating}
                >
                    {t('createList.back')}
                </button>
                <button
                    id="create-list-button"
                    type="button"
                    className="flex-1 px-8 py-4 text-base font-semibold text-white bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full cursor-pointer transition-all duration-250 shadow-[0_4px_12px_var(--color-accent-glow)] disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_8px_24px_var(--color-accent-glow)]"
                    onClick={handleCreate}
                    disabled={isCreating}
                >
                    {isCreating ? t('createList.creating') : t('createList.step2Create')}
                </button>
            </div>
        </motion.div>
    )
}
