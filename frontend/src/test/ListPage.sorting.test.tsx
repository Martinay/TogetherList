import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ListPage from '../features/view-list/ListPage'
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

describe('ListPage sorting', () => {
    beforeEach(() => {
        localStorage.clear()
        mockFetchListState.mockResolvedValue({
            name: 'Test List',
            participants: ['Alice'],
            items: {
                '1': {
                    id: '1',
                    title: 'banana',
                    completed: false,
                    created_by: 'Alice',
                    created_at: '2026-01-01T10:00:00Z',
                },
                '2': {
                    id: '2',
                    title: 'Apple',
                    completed: false,
                    created_by: 'Alice',
                    created_at: '2026-01-01T12:00:00Z',
                },
                '3': {
                    id: '3',
                    title: 'Completed older',
                    completed: true,
                    completed_at: '2026-01-01T09:00:00Z',
                    created_by: 'Alice',
                    created_at: '2026-01-01T08:00:00Z',
                },
                '4': {
                    id: '4',
                    title: 'Completed newer',
                    completed: true,
                    completed_at: '2026-01-01T11:00:00Z',
                    created_by: 'Alice',
                    created_at: '2026-01-01T07:00:00Z',
                },
            },
        })
    })

    it('renders active items in created date descending order by default', async () => {
        renderListPage()

        await waitFor(() => {
            expect(screen.getAllByTestId('active-item')).toHaveLength(2)
        })

        const activeTitles = screen.getAllByTestId('active-item').map(el => el.textContent)
        expect(activeTitles).toEqual(['Apple', 'banana'])
    })

    it('changes active items sort mode and persists per list in localStorage', async () => {
        renderListPage()

        await waitFor(() => {
            expect(screen.getByLabelText('Sort')).toBeInTheDocument()
        })

        fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'title_asc' } })

        const activeTitles = screen.getAllByTestId('active-item').map(el => el.textContent)
        expect(activeTitles).toEqual(['Apple', 'banana'])
        expect(localStorage.getItem('togetherlist:sort:list-1')).toBe('title_asc')
    })

    it('does not change completed section order when active sort mode changes', async () => {
        renderListPage()

        await waitFor(() => {
            expect(screen.getAllByTestId('completed-item')).toHaveLength(2)
        })

        const before = screen.getAllByTestId('completed-item').map(el => el.textContent)
        expect(before).toEqual(['Completed newer', 'Completed older'])

        fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'title_desc' } })

        const after = screen.getAllByTestId('completed-item').map(el => el.textContent)
        expect(after).toEqual(['Completed newer', 'Completed older'])
    })
})
