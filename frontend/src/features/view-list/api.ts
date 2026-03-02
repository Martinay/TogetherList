// API client for view-list feature
import { apiGet, apiPost, apiPut } from '../../api/client'
import type { ListState } from './types'

/**
 * Fetch the current state of a list
 */
export async function fetchListState(listId: string): Promise<ListState> {
    return apiGet<ListState>(`/list/${listId}`)
}

/**
 * Add a new item to a list
 */
export async function addItem(listId: string, title: string, createdBy: string) {
    return apiPost(`/list/${listId}/items`, { title, createdBy })
}

/**
 * Rename an item's title
 */
export async function renameItemTitle(listId: string, itemId: string, newTitle: string) {
    return apiPut(`/list/${listId}/items/${itemId}/title`, { newTitle })
}

/**
 * Toggle an item's completion status
 */
export async function toggleItemCompleted(listId: string, itemId: string, isCompleted: boolean, completedBy: string) {
    return apiPut(`/list/${listId}/items/${itemId}/completed`, { isCompleted, completedBy })
}
