import type { Item } from './types'

export type SortMode = 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc'

export const DEFAULT_SORT_MODE: SortMode = 'created_desc'

export function getSortStorageKey(listId: string): string {
    return `togetherlist:sort:${listId}`
}

export function isSortMode(value: string | null): value is SortMode {
    return value === 'created_desc'
        || value === 'created_asc'
        || value === 'title_asc'
        || value === 'title_desc'
}

export function getStoredSortMode(listId: string): SortMode {
    try {
        const storedValue = localStorage.getItem(getSortStorageKey(listId))
        return isSortMode(storedValue) ? storedValue : DEFAULT_SORT_MODE
    } catch {
        return DEFAULT_SORT_MODE
    }
}

export function persistSortMode(listId: string, mode: SortMode): void {
    try {
        localStorage.setItem(getSortStorageKey(listId), mode)
    } catch {
        // Ignore storage write failures and keep in-memory selection
    }
}

function compareCreatedAt(a: Item, b: Item): number {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

function compareTitle(a: Item, b: Item, collator: Intl.Collator): number {
    return collator.compare(a.title, b.title)
}

export function sortActiveItems(items: Item[], mode: SortMode, locale: string): Item[] {
    const collator = new Intl.Collator(locale, {
        sensitivity: 'base',
        usage: 'sort',
    })

    const sorted = [...items]

    sorted.sort((a, b) => {
        if (mode === 'created_desc') {
            return compareCreatedAt(b, a)
        }

        if (mode === 'created_asc') {
            return compareCreatedAt(a, b)
        }

        if (mode === 'title_asc') {
            return compareTitle(a, b, collator)
        }

        return compareTitle(b, a, collator)
    })

    return sorted
}
