import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CreateListPage from '../features/create-list/CreateListPage'
import '../i18n'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

describe('CreateListPage', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
        localStorage.clear()
        // Mock fetch for API calls
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ listId: 'test-uuid-1234-5678-9abc-def012345678' }),
        })
    })

    const navigateToStep2 = async () => {
        const nameInput = screen.getByPlaceholderText('e.g., Weekend Trip')
        fireEvent.change(nameInput, { target: { value: 'My List' } })
        fireEvent.click(screen.getByRole('button', { name: /continue/i }))

        await waitFor(() => {
            expect(screen.getByText("What's your name?")).toBeInTheDocument()
        })
    }

    const navigateToStep3 = async () => {
        await navigateToStep2()
        const nameInput = screen.getByPlaceholderText('Enter your name')
        fireEvent.change(nameInput, { target: { value: 'Alice' } })
        fireEvent.click(screen.getByRole('button', { name: /continue/i }))

        await waitFor(() => {
            expect(screen.getByText('Who else is joining?')).toBeInTheDocument()
        })
    }

    it('renders step 1 with list name input initially', () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        expect(screen.getByText("Name your list")).toBeInTheDocument()
        expect(screen.getByPlaceholderText('e.g., Weekend Trip')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('disables continue button when name is empty', () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        const continueButton = screen.getByRole('button', { name: /continue/i })
        expect(continueButton).toBeDisabled()
    })

    it('advances to step 2 when list name is entered', async () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        const nameInput = screen.getByPlaceholderText('e.g., Weekend Trip')
        fireEvent.change(nameInput, { target: { value: 'My List' } })

        const continueButton = screen.getByRole('button', { name: /continue/i })
        expect(continueButton).not.toBeDisabled()

        fireEvent.click(continueButton)

        await waitFor(() => {
            expect(screen.getByText("What's your name?")).toBeInTheDocument()
        })
    })

    it('shows creator name in participant list on step 3', async () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        await navigateToStep3()

        await waitFor(() => {
            expect(screen.getByText('Alice')).toBeInTheDocument()
            expect(screen.getByText('You')).toBeInTheDocument()
        })
    })

    it('allows adding and removing participants', async () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        await navigateToStep3()

        // Add a participant
        const participantInput = screen.getByPlaceholderText('Add a participant')
        fireEvent.change(participantInput, { target: { value: 'Bob' } })
        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        expect(screen.getByText('Bob')).toBeInTheDocument()

        // Remove the participant
        fireEvent.click(screen.getByRole('button', { name: /remove bob/i }))
        expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    })

    it('navigates to list page on create', async () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        await navigateToStep3()

        // Click create
        fireEvent.click(screen.getByRole('button', { name: /create list/i }))

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledTimes(1)
            expect(mockNavigate).toHaveBeenCalledWith(
                '/list/test-uuid-1234-5678-9abc-def012345678',
                { replace: true }
            )
        })

        // Verify fetch was called with correct arguments
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/v1/list/create'),
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'My List', creator: 'Alice', participants: [] }),
            })
        )
    })

    it('can go back from step 3 to step 2', async () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        await navigateToStep3()

        // Go back
        fireEvent.click(screen.getByRole('button', { name: /back/i }))

        await waitFor(() => {
            expect(screen.getByText("What's your name?")).toBeInTheDocument()
        })
    })

    it('shows error when adding duplicate participant name', async () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        await navigateToStep3()

        // Add a participant
        const participantInput = screen.getByPlaceholderText('Add a participant')
        fireEvent.change(participantInput, { target: { value: 'Bob' } })
        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        expect(screen.getByText('Bob')).toBeInTheDocument()

        // Try to add the same participant again
        fireEvent.change(participantInput, { target: { value: 'Bob' } })
        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        expect(screen.getByText('This name has already been added')).toBeInTheDocument()
    })

    it('shows error when adding participant with same name as creator', async () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        await navigateToStep3()

        // Try to add participant with same name as creator
        const participantInput = screen.getByPlaceholderText('Add a participant')
        fireEvent.change(participantInput, { target: { value: 'Alice' } })
        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        expect(screen.getByText('This name has already been added')).toBeInTheDocument()
    })

    it('clears error when input changes', async () => {
        render(
            <BrowserRouter>
                <CreateListPage />
            </BrowserRouter>
        )

        await navigateToStep3()

        // Try to add participant with same name as creator to trigger error
        const participantInput = screen.getByPlaceholderText('Add a participant')
        fireEvent.change(participantInput, { target: { value: 'Alice' } })
        fireEvent.click(screen.getByRole('button', { name: /add/i }))

        expect(screen.getByText('This name has already been added')).toBeInTheDocument()

        // Modify input - error should clear
        fireEvent.change(participantInput, { target: { value: 'Bob' } })

        expect(screen.queryByText('This name has already been added')).not.toBeInTheDocument()
    })
})
