import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AddItemForm from './AddItemForm'
import IdentityPicker from './IdentityPicker'
import Greeting from './Greeting'
import { ListItem } from './ListItem'
import ShareButton from './ShareButton'
import { useUserIdentity } from './useUserIdentity'
import { fetchListState } from './api'
import type { ListState } from './types'

function ListPage() {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()
    const [listState, setListState] = useState<ListState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Per-list identity management
    const { selectedName, selectName, clearName } = useUserIdentity(id || '')

    const refreshList = useCallback(async () => {
        if (!id) return

        try {
            const data = await fetchListState(id)
            setListState(data)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch list:', err)
            setError('Failed to load list')
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        refreshList()
    }, [refreshList])

    const handleIdentitySelect = (name: string) => {
        selectName(name)
    }

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-content p-8 max-w-[600px] mx-auto w-full">
                <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
                    <div className="w-8 h-8 border-3 border-bg-secondary border-t-accent-primary rounded-full animate-spin mb-4" />
                    <span>{t('list.loading')}</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-[600px] mx-auto w-full">
                <div className="text-center p-8 text-error bg-error-light rounded-xl">
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
        <div className="flex-1 flex flex-col max-w-[600px] mx-auto w-full p-8">
            <Greeting name={selectedName!} onClick={clearName} />
            <header className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <h1 className="text-[clamp(1.5rem,4vw,2rem)] font-bold bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent mb-2">
                        {listState?.name || 'Shared List'}
                    </h1>
                    <ShareButton listId={id!} />
                </div>
                {listState?.participants && listState.participants.length > 0 && (
                    <p className="text-sm text-text-secondary">
                        {listState.participants.join(', ')}
                    </p>
                )}
            </header>

            {selectedName && (
                <AddItemForm listId={id!} createdBy={selectedName} onItemAdded={refreshList} />
            )}

            {items.length === 0 ? (
                <div className="text-center py-12 text-text-secondary text-base">
                    {t('list.emptyList')}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {items.map((item) => (
                        <ListItem
                            key={item.id}
                            item={item}
                            listId={id!}
                            locale={i18n.language}
                            onItemUpdated={refreshList}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default ListPage
