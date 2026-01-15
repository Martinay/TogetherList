import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Item } from './types'

interface ListItemProps {
    item: Item
    locale: string
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

export function ListItem({ item, locale }: ListItemProps) {
    const { t } = useTranslation()
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div
            className={`list-page__item list-page__item--expandable ${item.completed ? 'list-page__item--completed' : ''} ${isExpanded ? 'list-page__item--expanded' : ''}`}
        >
            <button
                type="button"
                className="list-page__item-header"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <span className="list-page__item-title">{item.title}</span>
                <span className="list-page__item-chevron" aria-hidden="true">
                    {isExpanded ? '▲' : '▼'}
                </span>
            </button>
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
