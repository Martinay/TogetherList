import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import IdentityPicker from '../features/view-list/IdentityPicker'

describe('IdentityPicker', () => {
    const mockParticipants = ['Alice', 'Bob', 'Charlie']
    const mockOnSelect = vi.fn()

    const renderComponent = (participants = mockParticipants, onSelect = mockOnSelect) => {
        return render(
            <I18nextProvider i18n={i18n}>
                <IdentityPicker participants={participants} onSelect={onSelect} />
            </I18nextProvider>
        )
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the title and subtitle', () => {
        renderComponent()

        expect(screen.getByText('Who are you?')).toBeInTheDocument()
        expect(screen.getByText('Select your name to continue')).toBeInTheDocument()
    })

    it('renders all participant names as buttons', () => {
        renderComponent()

        expect(screen.getByRole('button', { name: 'Alice' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Bob' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Charlie' })).toBeInTheDocument()
    })

    it('calls onSelect with correct name when a button is clicked', () => {
        renderComponent()

        fireEvent.click(screen.getByRole('button', { name: 'Bob' }))

        expect(mockOnSelect).toHaveBeenCalledTimes(1)
        expect(mockOnSelect).toHaveBeenCalledWith('Bob')
    })

    it('renders with a single participant', () => {
        renderComponent(['Solo'])

        expect(screen.getByRole('button', { name: 'Solo' })).toBeInTheDocument()
    })

    it('renders all buttons as type="button"', () => {
        renderComponent()

        const buttons = screen.getAllByRole('button')
        buttons.forEach(button => {
            expect(button).toHaveAttribute('type', 'button')
        })
    })
})
