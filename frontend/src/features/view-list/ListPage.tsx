import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AddItemForm from './AddItemForm'
import IdentityPicker from './IdentityPicker'
import Greeting from './Greeting'
import { ListItem } from './ListItem'
import ShareButton from './ShareButton'
import { useUserIdentity } from './useUserIdentity'
import type { ListState } from './types'

function ListPage() {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()
    const [listState, setListState] = useState<ListState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Per-list identity management
    const { selectedName, selectName, clearName } = useUserIdentity(id || '')

    const fetchList = useCallback(async () => {
        if (!id) return

        try {
            const response = await fetch(`http://localhost:8080/api/v1/list/${id}`)
            if (response.ok) {
                const data = await response.json()
                setListState(data)
                setError(null)
            } else if (response.status === 404) {
                setError('List not found')
            } else {
                setError('Failed to load list')
            }
        } catch (err) {
            console.error('Failed to fetch list:', err)
            setError('Failed to load list')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchList()
    }, [fetchList])

    const handleItemAdded = () => {
        fetchList()
    }

    const handleIdentitySelect = (name: string) => {
        selectName(name)
    }

    if (loading) {
        return (
            <div className="list-page">
                <div className="list-page__loading">
                    <div className="list-page__spinner" />
                    <span>{t('list.loading')}</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="list-page">
                <div className="list-page__error">
                    {t('list.error')}
                </div>
            </div>
        )
    }

    // Show identity picker if no name is set and participants are available
    if (!selectedName && listState?.participants && listState.participants.length > 0) {
        return (
            <IdentityPicker
                participants={listState.participants}
                onSelect={handleIdentitySelect}
            />
        )
    }

    const items = listState?.items ? Object.values(listState.items) : []

    return (
        <div className="list-page">
            <Greeting name={selectedName!} onClick={clearName} />
            <header className="list-page__header">
                <div className="list-page__header-top">
                    <h1 className="list-page__title">
                        {listState?.name || 'Shared List'}
                    </h1>
                    <ShareButton listId={id!} />
                </div>
                {listState?.participants && listState.participants.length > 0 && (
                    <p className="list-page__participants">
                        {listState.participants.join(', ')}
                    </p>
                )}
            </header>

            {selectedName && (
                <AddItemForm listId={id!} createdBy={selectedName} onItemAdded={handleItemAdded} />
            )}

            {items.length === 0 ? (
                <div className="list-page__empty">
                    {t('list.emptyList')}
                </div>
            ) : (
                <div className="list-page__items">
                    {items.map((item) => (
                        <ListItem
                            key={item.id}
                            item={item}
                            locale={i18n.language}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default ListPage
