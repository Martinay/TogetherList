// API client for view-list feature

const API_BASE = 'http://localhost:8080/api/v1'

/**
 * Fetch the current state of a list
 */
export async function fetchListState(listId: string) {
    const response = await fetch(`${API_BASE}/list/${listId}`)
    if (!response.ok) {
        throw new Error(`Failed to fetch list: ${response.status}`)
    }
    return response.json()
}

/**
 * Add a new item to a list
 */
export async function addItem(listId: string, title: string, createdBy: string) {
    const response = await fetch(`${API_BASE}/list/${listId}/items`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, createdBy }),
    })
    if (!response.ok) {
        throw new Error(`Failed to add item: ${response.status}`)
    }
    return response.json()
}

/**
 * Rename an item's title
 */
export async function renameItemTitle(listId: string, itemId: string, newTitle: string) {
    const response = await fetch(`${API_BASE}/list/${listId}/items/${itemId}/title`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newTitle }),
    })
    if (!response.ok) {
        throw new Error(`Failed to rename item: ${response.status}`)
    }
    return response.json()
}
