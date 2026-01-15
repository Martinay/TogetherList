import { useState, useCallback } from 'react'

/**
 * Generates the LocalStorage key for a specific list's user identity.
 * Format: `list:<uuid>:username` as specified in REQ-0005.
 */
function getStorageKey(listId: string): string {
    return `list:${listId}:username`
}

interface UseUserIdentityReturn {
    /** Currently selected name, or null if not set */
    selectedName: string | null
    /** Persist name to LocalStorage */
    selectName: (name: string) => void
    /** Remove stored name (for switching identity) */
    clearName: () => void
}

/**
 * Custom hook for managing per-list user identity in LocalStorage.
 * 
 * When a user visits a list, their selected identity is persisted so they
 * don't need to re-select it on subsequent visits to the same list.
 * Different lists maintain independent identities.
 * 
 * @param listId - The UUID of the list
 * @returns Object with selectedName, selectName, and clearName
 */
export function useUserIdentity(listId: string): UseUserIdentityReturn {
    const storageKey = getStorageKey(listId)

    // Initialize from localStorage
    const [selectedName, setSelectedName] = useState<string | null>(() => {
        try {
            return localStorage.getItem(storageKey)
        } catch {
            // Handle cases where localStorage is not available (e.g., private browsing)
            return null
        }
    })

    const selectName = useCallback((name: string) => {
        try {
            localStorage.setItem(storageKey, name)
            setSelectedName(name)
        } catch {
            // If localStorage fails, still update local state for current session
            setSelectedName(name)
        }
    }, [storageKey])

    const clearName = useCallback(() => {
        try {
            localStorage.removeItem(storageKey)
        } catch {
            // Ignore localStorage errors
        }
        setSelectedName(null)
    }, [storageKey])

    return {
        selectedName,
        selectName,
        clearName,
    }
}

export default useUserIdentity
