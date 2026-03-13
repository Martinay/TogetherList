import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ListItem } from '../features/view-list/ListItem'
import '../i18n'

// Mock the API module
vi.mock('../features/view-list/api', () => ({
    renameItemTitle: vi.fn().mockResolvedValue({}),
    toggleItemCompleted: vi.fn().mockResolvedValue({}),
    editItemDescription: vi.fn().mockResolvedValue({}),
    assignItemParticipants: vi.fn().mockResolvedValue({}),
}))

import { toggleItemCompleted, editItemDescription, assignItemParticipants } from '../features/view-list/api'

const baseItem = {
    id: 'item-1',
    title: 'Buy groceries',
    completed: false,
    created_by: 'Alice',
    created_at: '2026-03-01T10:00:00Z',
}

const completedItem = {
    ...baseItem,
    completed: true,
    completed_by: 'Bob',
    completed_at: '2026-03-01T12:00:00Z',
}

const defaultProps = {
    listId: 'list-1',
    locale: 'en',
    currentUser: 'Alice',
    participants: ['Alice', 'Bob', 'Carol'],
    onItemUpdated: vi.fn(),
    onItemToggled: vi.fn(),
}

describe('ListItem completion', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders a checkbox for uncompleted item', () => {
        render(<ListItem item={baseItem} {...defaultProps} />)

        const checkbox = screen.getByRole('button', { name: /mark complete/i })
        expect(checkbox).toBeInTheDocument()
    })

    it('renders a checked checkbox for completed item', () => {
        render(<ListItem item={completedItem} {...defaultProps} />)

        const checkbox = screen.getByRole('button', { name: /mark incomplete/i })
        expect(checkbox).toBeInTheDocument()
    })

    it('calls toggleItemCompleted when checkbox is clicked', async () => {
        render(<ListItem item={baseItem} {...defaultProps} />)

        const checkbox = screen.getByRole('button', { name: /mark complete/i })
        fireEvent.click(checkbox)

        await waitFor(() => {
            expect(toggleItemCompleted).toHaveBeenCalledWith('list-1', 'item-1', true, 'Alice')
        })
    })

    it('calls onItemToggled after successful toggle', async () => {
        render(<ListItem item={baseItem} {...defaultProps} />)

        const checkbox = screen.getByRole('button', { name: /mark complete/i })
        fireEvent.click(checkbox)

        await waitFor(() => {
            expect(defaultProps.onItemToggled).toHaveBeenCalledWith('item-1')
        })
    })

    it('calls onItemUpdated after successful toggle', async () => {
        render(<ListItem item={baseItem} {...defaultProps} />)

        const checkbox = screen.getByRole('button', { name: /mark complete/i })
        fireEvent.click(checkbox)

        await waitFor(() => {
            expect(defaultProps.onItemUpdated).toHaveBeenCalled()
        })
    })

    it('applies strikethrough styling to completed item title', () => {
        render(<ListItem item={completedItem} {...defaultProps} />)

        const title = screen.getByText('Buy groceries')
        expect(title.className).toContain('line-through')
    })

    it('does not show edit button for completed items', () => {
        render(<ListItem item={completedItem} {...defaultProps} />)

        const editButton = screen.queryByRole('button', { name: /edit/i })
        expect(editButton).not.toBeInTheDocument()
    })

    it('shows edit button for uncompleted items', () => {
        render(<ListItem item={baseItem} {...defaultProps} />)

        const editButton = screen.getByRole('button', { name: /edit/i })
        expect(editButton).toBeInTheDocument()
    })

    it('toggles uncomplete when clicking completed item checkbox', async () => {
        render(<ListItem item={completedItem} {...defaultProps} />)

        const checkbox = screen.getByRole('button', { name: /mark incomplete/i })
        fireEvent.click(checkbox)

        await waitFor(() => {
            expect(toggleItemCompleted).toHaveBeenCalledWith('list-1', 'item-1', false, 'Alice')
        })
    })
})

describe('ListItem assignment', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('assigns a participant from details panel', async () => {
        render(<ListItem item={baseItem} {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: /buy groceries/i }))
        fireEvent.click(screen.getByLabelText('Alice'))

        await waitFor(() => {
            expect(assignItemParticipants).toHaveBeenCalledWith('list-1', 'item-1', ['Alice'])
        })
    })

    it('clears assignment', async () => {
        const itemWithAssignees = { ...baseItem, assigned_to: ['Alice', 'Bob'] }
        render(<ListItem item={itemWithAssignees} {...defaultProps} />)

        fireEvent.click(screen.getByRole('button', { name: /buy groceries/i }))
        fireEvent.click(screen.getByRole('button', { name: /clear assignment/i }))

        await waitFor(() => {
            expect(assignItemParticipants).toHaveBeenCalledWith('list-1', 'item-1', [])
        })
    })
})

describe('ListItem description', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows saving and saved indicators when editing description', async () => {
        // We'll mock editItemDescription to take a short, measurable time (100ms)
        // so we can reliably assert the "Saving..." state before it resolves.
        vi.mocked(editItemDescription).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({}), 100))
        )

        render(<ListItem item={baseItem} {...defaultProps} />)

        const textarea = screen.getByRole('textbox', { name: "Item description" })

        // Change the value and blur to trigger auto-save
        fireEvent.change(textarea, { target: { value: 'New description text' } })
        fireEvent.blur(textarea)

        // Verify "Saving..." indicator appears synchronously or almost immediately
        await waitFor(() => {
            expect(screen.getByText('Saving...')).toBeInTheDocument()
        })

        // Wait for the UI to update to "Saved" (after 100ms when promise resolves)
        await waitFor(() => {
            expect(screen.getByText('Saved')).toBeInTheDocument()
        })

        // Verify the mock was called with correct arguments
        expect(editItemDescription).toHaveBeenCalledWith('list-1', 'item-1', 'New description text')

        // Wait for the indicator to disappear (2000ms delay defined in ListItem.tsx)
        await waitFor(() => {
            expect(screen.queryByText('Saved')).not.toBeInTheDocument()
        }, { timeout: 3000 })
    })

    it('shows error indicator when save fails', async () => {
        vi.mocked(editItemDescription).mockRejectedValue(new Error('Network error'))

        render(<ListItem item={baseItem} {...defaultProps} />)

        const textarea = screen.getByRole('textbox', { name: "Item description" })

        fireEvent.change(textarea, { target: { value: 'This will fail to save' } })
        fireEvent.blur(textarea)

        await waitFor(() => {
            expect(screen.getByText('Failed to save')).toBeInTheDocument()
        })
    })
})
