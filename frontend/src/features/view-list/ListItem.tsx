import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { assignItemParticipants, renameItemTitle, toggleItemCompleted, editItemDescription } from './api'
import type { Item } from './types'

interface ListItemProps {
    item: Item
    listId: string
    locale: string
    currentUser: string
    participants: string[]
    onItemUpdated: () => void
    onItemToggled?: (itemId: string) => void
}

function formatTimestamp(isoString: string, locale: string): string {
    try {
        const date = new Date(isoString)
        return date.toLocaleString(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
    } catch {
        return isoString
    }
}

export function ListItem({ item, listId, locale, currentUser, participants, onItemUpdated, onItemToggled }: ListItemProps) {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(item.title)
    const [isSaving, setIsSaving] = useState(false)
    const [isToggling, setIsToggling] = useState(false)
    const [isAssigning, setIsAssigning] = useState(false)

    const [editDescription, setEditDescription] = useState(item.description || '')
    const [isSavingDesc, setIsSavingDesc] = useState(false)
    const [saveDescStatus, setSaveDescStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const descTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const assignedTo = item.assigned_to || []

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const startEditing = () => {
        setEditTitle(item.title)
        setIsEditing(true)
    }

    const cancelEditing = () => {
        setIsEditing(false)
        setEditTitle(item.title)
    }

    const saveEdit = async () => {
        const trimmedTitle = editTitle.trim()
        if (!trimmedTitle || trimmedTitle === item.title) {
            cancelEditing()
            return
        }

        setIsSaving(true)
        try {
            await renameItemTitle(listId, item.id, trimmedTitle)
            setIsEditing(false)
            onItemUpdated()
        } catch (error) {
            console.error('Failed to update item:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleCompleted = async () => {
        if (isToggling) return
        setIsToggling(true)
        try {
            await toggleItemCompleted(listId, item.id, !item.completed, currentUser)
            onItemToggled?.(item.id)
            onItemUpdated()
        } catch (error) {
            console.error('Failed to toggle item completion:', error)
        } finally {
            setIsToggling(false)
        }
    }

    const saveDescription = async (newDesc: string) => {
        if (newDesc === item.description) return

        setIsSavingDesc(true)
        setSaveDescStatus('saving')
        try {
            await editItemDescription(listId, item.id, newDesc)
            setSaveDescStatus('saved')
            onItemUpdated()

            if (descTimeoutRef.current) clearTimeout(descTimeoutRef.current)
            descTimeoutRef.current = setTimeout(() => {
                setSaveDescStatus('idle')
            }, 2000)
        } catch (error) {
            console.error('Failed to update description:', error)
            setSaveDescStatus('error')
        } finally {
            setIsSavingDesc(false)
        }
    }

    const handleDescriptionBlur = () => {
        saveDescription(editDescription)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            saveEdit()
        } else if (e.key === 'Escape') {
            cancelEditing()
        }
    }

    const handleToggleAssignee = async (participant: string) => {
        if (isAssigning) return
        const next = assignedTo.includes(participant)
            ? assignedTo.filter((name) => name !== participant)
            : [...assignedTo, participant]

        setIsAssigning(true)
        try {
            await assignItemParticipants(listId, item.id, next)
            onItemUpdated()
        } catch (error) {
            console.error('Failed to update assignees:', error)
        } finally {
            setIsAssigning(false)
        }
    }

    const handleClearAssignment = async () => {
        if (isAssigning || assignedTo.length === 0) return
        setIsAssigning(true)
        try {
            await assignItemParticipants(listId, item.id, [])
            onItemUpdated()
        } catch (error) {
            console.error('Failed to clear assignees:', error)
        } finally {
            setIsAssigning(false)
        }
    }

    const isCompleted = item.completed

    return (
        <div className={`flex flex-col rounded-xl border shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-200 ${isCompleted ? 'bg-bg-secondary border-border-light opacity-60' : 'bg-bg-card border-border-light hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]'}`}>
            <div className="flex items-center gap-3 p-4 w-full bg-transparent text-left transition-colors duration-150 hover:bg-[rgba(0,0,0,0.02)]">
                <button
                    type="button"
                    className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${isCompleted ? 'bg-accent-primary border-accent-primary' : 'bg-transparent border-text-secondary hover:border-accent-primary'} ${isToggling ? 'opacity-50' : ''}`}
                    onClick={handleToggleCompleted}
                    disabled={isToggling}
                    aria-label={isCompleted ? t('list.completeItem.uncomplete') : t('list.completeItem.complete')}
                    title={isCompleted ? t('list.completeItem.uncomplete') : t('list.completeItem.complete')}
                >
                    {isCompleted && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 px-4 py-2 text-base font-[inherit] bg-bg-card border border-accent-primary rounded-lg text-text-primary outline-none shadow-[0_0_0_3px_var(--color-accent-glow)]"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={saveEdit}
                        disabled={isSaving}
                    />
                ) : (
                    <>
                        <button
                            type="button"
                            className="flex-1 flex flex-col items-start gap-1 bg-transparent border-none cursor-pointer text-left font-[inherit] p-0 pr-8 relative"
                            onClick={() => setIsExpanded(!isExpanded)}
                            aria-expanded={isExpanded}
                        >
                            <span className={`flex-1 text-base transition-all duration-200 ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                {item.title}
                            </span>

                            {!isExpanded && item.description && (
                                <span data-testid="item-description-preview" className={`w-full text-xs text-text-secondary mt-1 truncate ${isCompleted ? 'opacity-50' : ''}`}>
                                    {item.description}
                                </span>
                            )}

                            {!isExpanded && assignedTo.length > 0 && (
                                <span className={`w-full text-xs text-text-secondary mt-1 truncate ${isCompleted ? 'opacity-50' : ''}`}>
                                    {t('list.itemDetails.assignedTo')}: {assignedTo.join(', ')}
                                </span>
                            )}

                            <span className={`absolute right-4 top-4 text-xs text-text-secondary transition-transform duration-250 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true">
                                {isExpanded ? '▲' : '▼'}
                            </span>
                        </button>
                        {!isCompleted && (
                            <button
                                type="button"
                                className="bg-transparent border-none cursor-pointer p-1 text-base opacity-60 transition-all duration-150 hover:opacity-100 hover:scale-110"
                                onClick={startEditing}
                                aria-label={t('list.editItem.button')}
                                title={t('list.editItem.button')}
                            >
                                ✏️
                            </button>
                        )}
                    </>
                )}
            </div>
            <div className={`overflow-hidden transition-all duration-250 bg-bg-secondary border-t flex flex-col ${isExpanded ? 'max-h-[700px] opacity-100 p-4 border-t-border-light' : 'max-h-0 opacity-0 px-4 py-0 border-t-transparent'}`}>
                <div className="mb-4">
                    <div className="mb-2 text-sm text-text-secondary">{t('list.itemDetails.assignedTo')}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {participants.map((participant) => {
                            const checked = assignedTo.includes(participant)
                            return (
                                <label key={participant} className="inline-flex items-center gap-2 text-sm bg-bg-card border border-border-light rounded-md px-2 py-1 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleToggleAssignee(participant)}
                                        disabled={isAssigning}
                                    />
                                    <span>{participant}</span>
                                </label>
                            )
                        })}
                    </div>
                    <button
                        type="button"
                        className="text-xs px-2 py-1 rounded border border-border-light text-text-secondary hover:text-text-primary disabled:opacity-50"
                        onClick={handleClearAssignment}
                        disabled={isAssigning || assignedTo.length === 0}
                    >
                        {t('list.itemDetails.clearAssignment')}
                    </button>
                </div>

                <div className="mb-4 relative">
                    <textarea
                        className={`w-full bg-bg-card border rounded-lg p-3 text-sm text-text-primary min-h-[80px] max-h-[120px] resize-none overflow-y-auto outline-none transition-colors
                            ${isCompleted ? 'opacity-60 cursor-not-allowed' : 'focus:border-accent-primary focus:ring-1 focus:ring-accent-primary'}
                            ${saveDescStatus === 'error' ? 'border-error' : 'border-border-light'}`}
                        placeholder={t('list.itemDetails.descriptionPlaceholder', 'Add description...')}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        onBlur={handleDescriptionBlur}
                        disabled={isCompleted || isSavingDesc}
                        aria-label="Item description"
                    />

                    {saveDescStatus !== 'idle' && (
                        <div className={`absolute right-3 bottom-3 text-xs flex items-center gap-1 bg-bg-card px-2 py-1 rounded shadow-sm border border-border-light
                            ${saveDescStatus === 'error' ? 'text-error' : 'text-text-secondary'}`}>
                            {saveDescStatus === 'saving' && <span className="w-3 h-3 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" />}
                            {saveDescStatus === 'saved' && <span>✓</span>}
                            <span>
                                {saveDescStatus === 'saving' && t('list.itemDetails.saving', 'Saving...')}
                                {saveDescStatus === 'saved' && t('list.itemDetails.saved', 'Saved')}
                                {saveDescStatus === 'error' && t('list.itemDetails.saveError', 'Failed to save')}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-auto pt-2 border-t border-border-light border-opacity-50">
                    <div className="flex gap-2 items-baseline text-sm">
                        <span className="text-text-secondary">{t('list.itemDetails.createdBy')}</span>
                        <span className="text-text-primary font-medium">{item.created_by}</span>
                    </div>
                    <div className="flex gap-2 items-baseline text-sm">
                        <span className="text-text-secondary">{t('list.itemDetails.createdAt')}</span>
                        <span className="text-text-primary font-medium">{formatTimestamp(item.created_at, locale)}</span>
                    </div>
                    {item.completed && item.completed_by && (
                        <div className="flex gap-2 items-baseline text-sm">
                            <span className="text-text-secondary">{t('list.itemDetails.completedBy', 'Completed by')}</span>
                            <span className="text-text-primary font-medium">{item.completed_by}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
