import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ListItem } from '../features/view-list/ListItem'
import '../i18n'

// Mock the API module
vi.mock('../features/view-list/api', () => ({
    renameItemTitle: vi.fn().mockResolvedValue({}),
    toggleItemCompleted: vi.fn().mockResolvedValue({}),
}))

import { toggleItemCompleted } from '../features/view-list/api'

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
