import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import '../i18n'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

describe('LandingPage', () => {
    it('renders the landing page with title and button', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        expect(screen.getByText('TogetherList')).toBeInTheDocument()
        expect(screen.getByText('Create New List')).toBeInTheDocument()
    })

    it('navigates to /list/:uuid when Create List button is clicked', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        const button = screen.getByRole('button', { name: /create new list/i })
        fireEvent.click(button)

        expect(mockNavigate).toHaveBeenCalledTimes(1)
        expect(mockNavigate).toHaveBeenCalledWith('/list/new')
    })
})
