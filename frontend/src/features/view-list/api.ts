// API client for view-list feature
import { loadList, mutateList } from '../offline/store'
import type { ListState } from './types'

/**
 * Fetch the current state of a list
 */
export async function fetchListState(listId: string): Promise<ListState> {
    return loadList(listId)
}

/**
 * Rename a list
 */
export async function renameList(listId: string, name: string, renamedBy: string) {
    return mutateList(`/list/${listId}/name`, 'PUT', { name, renamedBy }).then(() => ({}))
}

/**
 * Add a new item to a list
 */
export async function addItem(listId: string, title: string, createdBy: string) {
    return mutateList(`/list/${listId}/items`, 'POST', { title, createdBy })
}

/**
 * Rename an item's title
 */
export async function renameItemTitle(listId: string, itemId: string, newTitle: string) {
    return mutateList(`/list/${listId}/items/${itemId}/title`, 'PUT', { newTitle }).then(() => ({}))
}

/**
 * Edit an item's description
 */
export async function editItemDescription(listId: string, itemId: string, description: string) {
    return mutateList(`/list/${listId}/items/${itemId}/description`, 'PUT', { description }).then(() => ({}))
}

/**
 * Toggle an item's completion status
 */
export async function toggleItemCompleted(listId: string, itemId: string, isCompleted: boolean, completedBy: string) {
    return mutateList(`/list/${listId}/items/${itemId}/completed`, 'PUT', { isCompleted, completedBy }).then(() => ({}))
}

/**
 * Assign participants to an item (empty array clears assignment)
 */
export async function assignItemParticipants(listId: string, itemId: string, assignedTo: string[]) {
    return mutateList(`/list/${listId}/items/${itemId}/assigned-to`, 'PUT', { assignedTo }).then(() => ({}))
}
