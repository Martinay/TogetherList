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
import type { ListState, Item } from './types'

function ListPage() {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()
    const [listState, setListState] = useState<ListState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sessionToggledIds, setSessionToggledIds] = useState<Set<string>>(new Set())

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

    const handleItemToggled = (itemId: string) => {
        setSessionToggledIds(prev => new Set(prev).add(itemId))
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

    const allItems = listState?.items ? Object.values(listState.items) : []

    // Split items: active items + session-toggled completed items stay in place
    // Completed items NOT toggled this session go to the "Completed" section
    const activeItems: Item[] = []
    const completedSectionItems: Item[] = []

    for (const item of allItems) {
        if (!item.completed || sessionToggledIds.has(item.id)) {
            activeItems.push(item)
        } else {
            completedSectionItems.push(item)
        }
    }

    // Sort completed section by completed_at descending (latest first)
    completedSectionItems.sort((a, b) => {
        const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return bTime - aTime
    })

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

            {activeItems.length === 0 && completedSectionItems.length === 0 ? (
                <div className="text-center py-12 text-text-secondary text-base">
                    {t('list.emptyList')}
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-2">
                        {activeItems.map((item) => (
                            <ListItem
                                key={item.id}
                                item={item}
                                listId={id!}
                                locale={i18n.language}
                                currentUser={selectedName!}
                                onItemUpdated={refreshList}
                                onItemToggled={handleItemToggled}
                            />
                        ))}
                    </div>

                    {completedSectionItems.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                                {t('list.completed.section')}
                                <span className="text-xs font-normal">
                                    {t('list.completed.count', { count: completedSectionItems.length })}
                                </span>
                            </h2>
                            <div className="flex flex-col gap-2">
                                {completedSectionItems.map((item) => (
                                    <ListItem
                                        key={item.id}
                                        item={item}
                                        listId={id!}
                                        locale={i18n.language}
                                        currentUser={selectedName!}
                                        onItemUpdated={refreshList}
                                        onItemToggled={handleItemToggled}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default ListPage
