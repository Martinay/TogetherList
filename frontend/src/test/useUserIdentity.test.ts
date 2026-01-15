import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUserIdentity } from '../features/view-list/useUserIdentity'

describe('useUserIdentity', () => {
    const mockListId = 'test-list-123'
    const expectedStorageKey = `list:${mockListId}:username`

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear()
        vi.clearAllMocks()
    })

    it('returns null when no name is stored', () => {
        const { result } = renderHook(() => useUserIdentity(mockListId))

        expect(result.current.selectedName).toBeNull()
    })

    it('reads stored name from localStorage', () => {
        localStorage.setItem(expectedStorageKey, 'Alice')

        const { result } = renderHook(() => useUserIdentity(mockListId))

        expect(result.current.selectedName).toBe('Alice')
    })

    it('selectName writes to localStorage with correct key format', () => {
        const { result } = renderHook(() => useUserIdentity(mockListId))

        act(() => {
            result.current.selectName('Bob')
        })

        expect(localStorage.getItem(expectedStorageKey)).toBe('Bob')
        expect(result.current.selectedName).toBe('Bob')
    })

    it('clearName removes the stored value', () => {
        localStorage.setItem(expectedStorageKey, 'Charlie')
        const { result } = renderHook(() => useUserIdentity(mockListId))

        expect(result.current.selectedName).toBe('Charlie')

        act(() => {
            result.current.clearName()
        })

        expect(localStorage.getItem(expectedStorageKey)).toBeNull()
        expect(result.current.selectedName).toBeNull()
    })

    it('isolates different list IDs', () => {
        const listId1 = 'list-1'
        const listId2 = 'list-2'

        // Set names for two different lists
        localStorage.setItem(`list:${listId1}:username`, 'Alice')
        localStorage.setItem(`list:${listId2}:username`, 'Bob')

        const { result: result1 } = renderHook(() => useUserIdentity(listId1))
        const { result: result2 } = renderHook(() => useUserIdentity(listId2))

        expect(result1.current.selectedName).toBe('Alice')
        expect(result2.current.selectedName).toBe('Bob')
    })

    it('uses correct storage key format: list:<uuid>:username', () => {
        const uuid = 'e4ba0de6-aa5a-4214-b3d1-d4466246deb3'
        const { result } = renderHook(() => useUserIdentity(uuid))

        act(() => {
            result.current.selectName('TestUser')
        })

        // Verify the key format matches REQ-0005 specification
        expect(localStorage.getItem(`list:${uuid}:username`)).toBe('TestUser')
    })

    it('handles localStorage not available gracefully', () => {
        // Mock localStorage to throw an error
        const originalGetItem = localStorage.getItem
        const originalSetItem = localStorage.setItem

        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('localStorage not available')
        })
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('localStorage not available')
        })

        const { result } = renderHook(() => useUserIdentity(mockListId))

        // Should not throw, and return null
        expect(result.current.selectedName).toBeNull()

        // selectName should still update local state even if localStorage fails
        act(() => {
            result.current.selectName('Fallback')
        })
        expect(result.current.selectedName).toBe('Fallback')

        // Restore mocks
        vi.mocked(localStorage.getItem).mockRestore()
        vi.mocked(localStorage.setItem).mockRestore()
    })
})
