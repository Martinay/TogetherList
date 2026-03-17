import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AddItemForm from './AddItemForm'
import IdentityPicker from './IdentityPicker'
import Greeting from './Greeting'
import ListHeader from './ListHeader'
import { ListItem } from './ListItem'
import { useUserIdentity } from './useUserIdentity'
import { fetchListState } from './api'
import { DEFAULT_SORT_MODE, getStoredSortMode, persistSortMode, sortActiveItems, type SortMode } from './sorting'
import type { ListState, Item } from './types'

function ListPage() {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()
    const [listState, setListState] = useState<ListState | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sessionToggledIds, setSessionToggledIds] = useState<Set<string>>(new Set())
    const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT_MODE)

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

    useEffect(() => {
        if (!id) {
            setSortMode(DEFAULT_SORT_MODE)
            return
        }

        setSortMode(getStoredSortMode(id))
    }, [id])

    const handleSortModeChange = (mode: SortMode) => {
        if (!id) return

        setSortMode(mode)
        persistSortMode(id, mode)
    }

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

    const sortedActiveItems = sortActiveItems(activeItems, sortMode, i18n.language)

    // Sort completed section by completed_at descending (latest first)
    completedSectionItems.sort((a, b) => {
        const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return bTime - aTime
    })

    return (
        <div className="flex-1 flex flex-col max-w-[600px] mx-auto w-full p-8">
            <Greeting name={selectedName!} onClick={clearName} />

            <ListHeader
                listId={id!}
                currentName={listState?.name || 'Shared List'}
                participants={listState?.participants || []}
                currentUser={selectedName!}
                onNameUpdated={refreshList}
            />

            {selectedName && (
                <AddItemForm listId={id!} createdBy={selectedName} onItemAdded={refreshList} />
            )}

            {activeItems.length > 0 && (
                <div className="mb-3 flex items-center justify-end gap-2">
                    <label htmlFor="active-sort" className="text-sm text-text-secondary">
                        {t('list.sort.label')}
                    </label>
                    <select
                        id="active-sort"
                        value={sortMode}
                        onChange={(e) => handleSortModeChange(e.target.value as SortMode)}
                        className="text-sm rounded-md border border-border-light bg-bg-card text-text-primary px-2 py-1"
                        aria-label={t('list.sort.label')}
                    >
                        <option value="created_desc">{t('list.sort.options.newestFirst')}</option>
                        <option value="created_asc">{t('list.sort.options.oldestFirst')}</option>
                        <option value="title_asc">{t('list.sort.options.aToZ')}</option>
                        <option value="title_desc">{t('list.sort.options.zToA')}</option>
                    </select>
                </div>
            )}

            {activeItems.length === 0 && completedSectionItems.length === 0 ? (
                <div className="text-center py-12 text-text-secondary text-base">
                    {t('list.emptyList')}
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-2">
                        {sortedActiveItems.map((item) => (
                            <ListItem
                                key={item.id}
                                item={item}
                                listId={id!}
                                locale={i18n.language}
                                currentUser={selectedName!}
                                onItemUpdated={refreshList}
                                onItemToggled={handleItemToggled}
                                participants={listState?.participants || []}
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
                                        participants={listState?.participants || []}
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
