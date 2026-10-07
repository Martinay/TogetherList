import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import PrivacyControls from '../features/privacy/privacy-controls'
import PrivacyPage from '../features/privacy/privacy-page'
import { consentKey } from '../features/privacy/clarity'
beforeEach(() => { localStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('offers equally reachable opt-in and revoke choices with persistent status and privacy link', () => {
    render(<PrivacyControls />)
    expect(screen.getByText('Analytics: no choice yet.')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
    fireEvent.click(screen.getByRole('button', { name: 'Allow analytics' }))
    expect(localStorage.getItem(consentKey)).toBe('accepted')
    fireEvent.click(screen.getByRole('button', { name: 'Decline / revoke analytics' }))
    expect(localStorage.getItem(consentKey)).toBe('declined')
    expect(screen.getByText('Analytics: declined.')).toBeVisible()
})
it('announces storage failure and does not report successful acceptance', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    render(<PrivacyControls />)
    fireEvent.click(screen.getByRole('button', { name: 'Allow analytics' }))
    expect(screen.getByRole('alert')).toHaveTextContent('could not be saved')
    expect(screen.getByText('Analytics: no choice yet.')).toBeVisible()
})
it('describes behavioral data, cookies, purpose and Microsoft policy', () => {
    render(<PrivacyPage />)
    expect(screen.getByText(/behavioral metrics/)).toHaveTextContent('session replay')
    expect(screen.getByText(/behavioral metrics/)).toHaveTextContent('third-party cookies')
    expect(screen.getByRole('link', { name: 'Microsoft Privacy Statement' })).toHaveAttribute('href', 'https://privacy.microsoft.com/privacystatement')
})
