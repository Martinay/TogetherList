import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LandingPage from '../features/create-list/LandingPage'
import '../i18n'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

describe('LandingPage', () => {
    it('renders the headline with SEO keywords', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
            /Create.*Share.*Lists.*No Sign-Up/i
        )
    })

    it('renders the Create New List button', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        expect(screen.getByText('Create New List')).toBeInTheDocument()
    })

    it('navigates to /list/new when Create List button is clicked', () => {
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

    it('renders the How It Works section with 3 steps', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        expect(screen.getByText('How It Works')).toBeInTheDocument()
        expect(screen.getByText('Create a List')).toBeInTheDocument()
        expect(screen.getByText('Share the Link')).toBeInTheDocument()
        expect(screen.getByText('Collaborate in Real Time')).toBeInTheDocument()
    })

    it('renders the Features section with 6 feature cards', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        expect(screen.getByText('Features')).toBeInTheDocument()
        expect(screen.getByText('No Sign-Up Required')).toBeInTheDocument()
        expect(screen.getByText('Real-Time Sync')).toBeInTheDocument()
        expect(screen.getByText('Share via Link')).toBeInTheDocument()
        expect(screen.getByText('Assign Items to People')).toBeInTheDocument()
        expect(screen.getByText('Mobile-Friendly')).toBeInTheDocument()
        expect(screen.getByText('100% Free')).toBeInTheDocument()
    })

    it('renders the Use Cases section', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        expect(screen.getByText('Perfect For')).toBeInTheDocument()
        expect(screen.getByText('Shopping Lists')).toBeInTheDocument()
        expect(screen.getByText('Party Planning')).toBeInTheDocument()
        expect(screen.getByText('Trip Packing')).toBeInTheDocument()
    })

    it('renders the Comparison section', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        expect(screen.getByText('Why TogetherList?')).toBeInTheDocument()
        expect(screen.getByText(/vs Google Keep/)).toBeInTheDocument()
        expect(screen.getByText(/vs AnyList/)).toBeInTheDocument()
        expect(screen.getByText(/vs Trello/)).toBeInTheDocument()
    })

    it('renders the FAQ section with collapsible questions', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument()
        expect(
            screen.getByText(/simplest app to create a shared list without requiring anyone to sign up/)
        ).toBeInTheDocument()
    })

    it('renders the bottom CTA with a second Create List button', () => {
        render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        const ctaButtons = screen.getAllByRole('button')
        expect(ctaButtons.length).toBeGreaterThanOrEqual(2)
    })

    it('uses semantic section elements', () => {
        const { container } = render(
            <BrowserRouter>
                <LandingPage />
            </BrowserRouter>
        )

        const sections = container.querySelectorAll('section')
        expect(sections.length).toBeGreaterThanOrEqual(6)
    })
})
