import { it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ListPage from '../features/view-list/ListPage'
import OfflineStatus from '../features/offline/OfflineStatus'
import '../i18n'

const mockFetchListState = vi.fn()

vi.mock('../features/view-list/api', () => ({
    fetchListState: (...args: unknown[]) => mockFetchListState(...args),
}))

vi.mock('../features/view-list/useUserIdentity', () => ({
    useUserIdentity: () => ({
        selectedName: 'Alice',
        selectName: vi.fn(),
        clearName: vi.fn(),
    }),
}))

vi.mock('../features/view-list/Greeting', () => ({
    default: () => <div>Greeting</div>,
}))

vi.mock('../features/view-list/ListHeader', () => ({
    default: () => <div>Header</div>,
}))

vi.mock('../features/view-list/AddItemForm', () => ({
    default: () => <div>AddForm</div>,
}))

vi.mock('../features/view-list/ListItem', () => ({
    ListItem: ({ item }: { item: { title: string, completed: boolean } }) => (
        <div data-testid={item.completed ? 'completed-item' : 'active-item'}>{item.title}</div>
    ),
}))

function renderListPage() {
    return render(
        <MemoryRouter initialEntries={['/list/list-1']}>
            <Routes>
                <Route path="/list/:id" element={<ListPage />} />
            </Routes>
        </MemoryRouter>
    )
}

vi.mock('../features/offline/store', () => ({ cachedList: () => null, offlineEvent: 'offline-update', replay: () => mockReplay(), syncStatus: () => ({ pending: 0, failed: false, offline: false, unavailable: false }), supportsOfflineEdits: () => true }))
const mockReplay = vi.fn().mockResolvedValue(undefined)

it('replays pending edits then refetches an empty list on a downward pull', async () => {
    mockFetchListState.mockResolvedValue({ name: 'Test List', participants: ['Alice'], items: {} })
    renderListPage()
    const empty = await screen.findByText(/No items/)
    fireEvent.touchStart(empty, { touches: [{ identifier: 1, clientX: 20, clientY: 20 }] })
    fireEvent.touchMove(empty, { touches: [{ identifier: 1, clientX: 20, clientY: 110 }] })
    fireEvent.touchEnd(empty, { touches: [], changedTouches: [{ identifier: 1, clientX: 20, clientY: 110 }] })
    await waitFor(() => expect(mockFetchListState).toHaveBeenCalledTimes(2))
    expect(mockReplay).toHaveBeenCalledTimes(1)
    expect(mockReplay.mock.invocationCallOrder[0]).toBeLessThan(mockFetchListState.mock.invocationCallOrder[1]!)
})

beforeEach(() => { vi.resetAllMocks(); mockReplay.mockResolvedValue(undefined); localStorage.clear() })
afterEach(() => { vi.useRealTimers() })

it('does not start another sync when polling overlaps a manual refresh', async () => {
    mockFetchListState.mockResolvedValue({ name: 'Test List', participants: ['Alice'], items: {} })
    vi.useFakeTimers()
    renderListPage()
    await act(async () => {})
    const empty = screen.getByText(/No items/)
    let finish!: () => void
    mockReplay.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve }))
    fireEvent.touchStart(empty, { touches: [{ identifier: 1, clientX: 20, clientY: 20 }] })
    fireEvent.touchMove(empty, { touches: [{ identifier: 1, clientX: 20, clientY: 110 }] })
    fireEvent.touchEnd(empty, { touches: [], changedTouches: [{ identifier: 1, clientX: 20, clientY: 110 }] })
    await act(async () => {})
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(mockReplay).toHaveBeenCalledTimes(1)
    await act(async () => finish())
})

it.each(['fetch', 'replay'])('retains the visible list after a %s failure and allows retry', async stage => {
    mockFetchListState.mockResolvedValue({ name: 'Test List', participants: ['Alice'], items: {} })
    vi.useFakeTimers()
    renderListPage()
    await act(async () => {})
    const empty = screen.getByText(/No items/)
    if (stage === 'fetch') mockFetchListState.mockRejectedValueOnce(new Error('network'))
    else mockReplay.mockRejectedValueOnce(new Error('storage'))
    const pull = () => {
        fireEvent.touchStart(empty, { touches: [{ identifier: 1, clientX: 20, clientY: 20 }] })
        fireEvent.touchMove(empty, { touches: [{ identifier: 1, clientX: 20, clientY: 110 }] })
        fireEvent.touchEnd(empty, { touches: [], changedTouches: [{ identifier: 1, clientX: 20, clientY: 110 }] })
    }
    await act(async () => pull())
    expect(screen.getByRole('status')).toHaveTextContent('Failed')
    expect(empty).toBeInTheDocument()
    await act(async () => pull())
    expect(mockReplay).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it.each(['fetch', 'replay'])('reports storage failure only for replay when polling encounters a %s error', async stage => {
    vi.useFakeTimers()
    mockFetchListState.mockResolvedValue({ name: 'Test List', participants: ['Alice'], items: {} })
    renderListPage()
    render(<OfflineStatus />)
    await act(async () => {})
    const storageError = vi.fn()
    window.addEventListener('togetherlist:storage-error', storageError)
    try {
        if (stage === 'fetch') mockFetchListState.mockRejectedValueOnce(new Error('network'))
        else mockReplay.mockRejectedValueOnce(new Error('storage'))
        await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
        expect(storageError).toHaveBeenCalledTimes(stage === 'replay' ? 1 : 0)
        if (stage === 'replay') expect(screen.getByRole('status')).toHaveTextContent('storage')
        else expect(screen.queryByRole('status')).not.toBeInTheDocument()
        await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
        expect(screen.getByText(/No items/)).toBeInTheDocument()
        if (stage === 'fetch') expect(screen.queryByRole('status')).not.toBeInTheDocument()
    } finally {
        window.removeEventListener('togetherlist:storage-error', storageError)
    }
})
