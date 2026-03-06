import { describe, it, expect, beforeEach } from 'vitest'
import {
    DEFAULT_SORT_MODE,
    getSortStorageKey,
    getStoredSortMode,
    isSortMode,
    persistSortMode,
    sortActiveItems,
    type SortMode,
} from '../features/view-list/sorting'
import type { Item } from '../features/view-list/types'

function createItem(overrides: Partial<Item>): Item {
    return {
        id: overrides.id || crypto.randomUUID(),
        title: overrides.title || 'Item',
        completed: overrides.completed ?? false,
        created_by: overrides.created_by || 'TestUser',
        created_at: overrides.created_at || '2026-01-01T00:00:00Z',
        description: overrides.description,
        completed_at: overrides.completed_at,
        completed_by: overrides.completed_by,
        assigned_to: overrides.assigned_to,
    }
}

describe('view-list sorting helpers', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('uses created_desc as default when nothing is stored', () => {
        expect(getStoredSortMode('list-1')).toBe(DEFAULT_SORT_MODE)
    })

    it('persists and reads sort mode per list', () => {
        persistSortMode('list-a', 'title_asc')
        persistSortMode('list-b', 'created_asc')

        expect(getStoredSortMode('list-a')).toBe('title_asc')
        expect(getStoredSortMode('list-b')).toBe('created_asc')
    })

    it('falls back to default mode for invalid stored values', () => {
        localStorage.setItem(getSortStorageKey('list-a'), 'invalid-mode')
        expect(getStoredSortMode('list-a')).toBe(DEFAULT_SORT_MODE)
    })

    it('validates all supported modes', () => {
        const validModes: SortMode[] = ['created_desc', 'created_asc', 'title_asc', 'title_desc']
        for (const mode of validModes) {
            expect(isSortMode(mode)).toBe(true)
        }
        expect(isSortMode('random')).toBe(false)
    })

    it('sorts by created date descending by default', () => {
        const items = [
            createItem({ id: '1', title: 'First', created_at: '2026-03-01T10:00:00Z' }),
            createItem({ id: '2', title: 'Second', created_at: '2026-03-01T12:00:00Z' }),
            createItem({ id: '3', title: 'Third', created_at: '2026-03-01T11:00:00Z' }),
        ]

        const sorted = sortActiveItems(items, 'created_desc', 'en')
        expect(sorted.map(item => item.id)).toEqual(['2', '3', '1'])
    })

    it('sorts titles case-insensitively and locale-aware', () => {
        const items = [
            createItem({ id: '1', title: 'zebra' }),
            createItem({ id: '2', title: 'Äpple' }),
            createItem({ id: '3', title: 'apple' }),
        ]

        const sorted = sortActiveItems(items, 'title_asc', 'en')
        expect(sorted.map(item => item.id)).toEqual(['2', '3', '1'])
    })
})
