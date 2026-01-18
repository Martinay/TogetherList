import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { renameItemTitle } from './api'
import type { Item } from './types'

interface ListItemProps {
    item: Item
    listId: string
    locale: string
    onItemUpdated: () => void
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

export function ListItem({ item, listId, locale, onItemUpdated }: ListItemProps) {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(item.title)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

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

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            saveEdit()
        } else if (e.key === 'Escape') {
            cancelEditing()
        }
    }

    return (
        <div
            className={`flex flex-col bg-bg-card rounded-xl border border-border-light shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] ${item.completed ? 'line-through' : ''}`}
        >
            <div className="flex items-center gap-4 p-4 w-full bg-transparent cursor-pointer text-left transition-colors duration-150 hover:bg-[rgba(0,0,0,0.02)]">
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
                            className="flex-1 flex items-center gap-4 bg-transparent border-none cursor-pointer text-left font-[inherit] text-base text-text-primary p-0"
                            onClick={() => setIsExpanded(!isExpanded)}
                            aria-expanded={isExpanded}
                        >
                            <span className={`flex-1 text-base ${item.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                                {item.title}
                            </span>
                            <span className={`text-xs text-text-secondary transition-transform duration-250 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true">
                                {isExpanded ? '▲' : '▼'}
                            </span>
                        </button>
                        <button
                            type="button"
                            className="bg-transparent border-none cursor-pointer p-1 text-base opacity-60 transition-all duration-150 hover:opacity-100 hover:scale-110"
                            onClick={startEditing}
                            aria-label={t('list.editItem.button')}
                            title={t('list.editItem.button')}
                        >
                            ✏️
                        </button>
                    </>
                )}
            </div>
            <div className={`overflow-hidden transition-all duration-250 bg-bg-secondary border-t ${isExpanded ? 'max-h-[200px] opacity-100 p-4 border-t-border-light' : 'max-h-0 opacity-0 px-4 py-0 border-t-transparent'}`}>
                <p className="flex gap-2 items-baseline m-0 text-sm">
                    <span className="text-text-secondary">{t('list.itemDetails.createdBy')}</span>
                    <span className="text-text-primary font-medium">{item.created_by}</span>
                </p>
                <p className="flex gap-2 items-baseline mt-2 text-sm">
                    <span className="text-text-secondary">{t('list.itemDetails.createdAt')}</span>
                    <span className="text-text-primary font-medium">{formatTimestamp(item.created_at, locale)}</span>
                </p>
            </div>
        </div>
    )
}
