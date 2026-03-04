import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi'
import { renameList } from './api'
import ShareButton from './ShareButton'

interface ListHeaderProps {
    listId: string
    currentName: string
    participants: string[]
    currentUser: string
    onNameUpdated: () => void
}

export default function ListHeader({ listId, currentName, participants, currentUser, onNameUpdated }: ListHeaderProps) {
    const { t } = useTranslation()
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(currentName)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            // Select all text when editing starts
            inputRef.current.select()
        }
    }, [isEditing])

    // Update local state if the external state changes while not editing
    useEffect(() => {
        if (!isEditing) {
            setName(currentName)
        }
    }, [currentName, isEditing])

    const handleSave = async () => {
        const trimmedName = name.trim()
        if (!trimmedName) {
            setError(t('list.name.required'))
            return
        }

        if (trimmedName === currentName) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        setError('')

        try {
            await renameList(listId, trimmedName, currentUser)
            setIsEditing(false)
            onNameUpdated()
        } catch (err) {
            console.error('Failed to rename list:', err)
            setError(t('list.error')) // Using a generic error message
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setName(currentName)
        setError('')
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSave()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            handleCancel()
        }
    }

    return (
        <header className="text-center mb-8 relative">
            <div className="flex items-center justify-center gap-4 flex-wrap relative">
                {isEditing ? (
                    <div className="flex flex-col items-center flex-1 max-w-[400px]">
                        <div className="flex w-full items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                className={`flex-1 p-2 text-xl font-bold text-center bg-bg-card border rounded-lg outline-none transition-colors ${error ? 'border-error' : 'border-accent-primary'}`}
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value)
                                    if (error) setError('')
                                }}
                                onKeyDown={handleKeyDown}
                                disabled={isSaving}
                            />
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !name.trim()}
                                className="p-2 text-accent-primary hover:bg-accent-primary hover:text-white border border-accent-primary rounded-lg transition-colors disabled:opacity-50"
                                aria-label={t('list.name.save')}
                                title={t('list.name.save')}
                            >
                                <FiCheck size={20} />
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="p-2 text-text-secondary hover:text-error hover:bg-error-light rounded-lg transition-colors disabled:opacity-50"
                                aria-label={t('list.name.cancel')}
                                title={t('list.name.cancel')}
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                        {error && <span className="text-error text-sm mt-1">{error}</span>}
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-bold bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent mb-2">
                            {currentName || 'Shared List'}
                        </h1>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 text-text-secondary hover:text-accent-primary transition-colors hover:bg-bg-secondary rounded-full -mt-2"
                            aria-label={t('list.name.edit')}
                            title={t('list.name.edit')}
                        >
                            <FiEdit2 size={16} />
                        </button>
                        <ShareButton listId={listId} />
                    </div>
                )}
            </div>
            {participants && participants.length > 0 && !isEditing && (
                <p className="text-sm text-text-secondary mt-1">
                    {participants.join(', ')}
                </p>
            )}
        </header>
    )
}
