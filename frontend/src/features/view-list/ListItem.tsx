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
            className={`list-page__item list-page__item--expandable ${item.completed ? 'list-page__item--completed' : ''} ${isExpanded ? 'list-page__item--expanded' : ''}`}
        >
            <div className="list-page__item-header">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="list-page__item-edit-input"
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
                            className="list-page__item-title-button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            aria-expanded={isExpanded}
                        >
                            <span className="list-page__item-title">{item.title}</span>
                            <span className="list-page__item-chevron" aria-hidden="true">
                                {isExpanded ? '▲' : '▼'}
                            </span>
                        </button>
                        <button
                            type="button"
                            className="list-page__item-edit-button"
                            onClick={startEditing}
                            aria-label={t('list.editItem.button')}
                            title={t('list.editItem.button')}
                        >
                            ✏️
                        </button>
                    </>
                )}
            </div>
            <div className={`list-page__item-details ${isExpanded ? 'list-page__item-details--visible' : ''}`}>
                <p className="list-page__item-meta">
                    <span className="list-page__item-meta-label">{t('list.itemDetails.createdBy')}</span>
                    <span className="list-page__item-meta-value">{item.created_by}</span>
                </p>
                <p className="list-page__item-meta">
                    <span className="list-page__item-meta-label">{t('list.itemDetails.createdAt')}</span>
                    <span className="list-page__item-meta-value">{formatTimestamp(item.created_at, locale)}</span>
                </p>
            </div>
        </div>
    )
}

