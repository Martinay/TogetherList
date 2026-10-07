import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import PrivacyControls from '../features/privacy/privacy-controls'
import PrivacyPage from '../features/privacy/privacy-page'
import { consentKey } from '../features/privacy/clarity'
beforeEach(() => { localStorage.clear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('offers equally reachable opt-in and revoke choices with persistent status and privacy link', () => {
    render(<PrivacyControls />)
    expect(screen.getByText('Analytics: no choice yet.')).toBeVisible()
    expect(within(screen.getByRole('dialog')).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
    fireEvent.click(screen.getByRole('button', { name: 'Allow analytics' }))
    expect(localStorage.getItem(consentKey)).toBe('accepted')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('button', { name: 'Allow analytics' })).toHaveFocus()
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

it('closes through persistent decline and retains footer re-enable controls after remount', () => {
    const view = render(<PrivacyControls />)
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close and decline analytics' }))
    expect(localStorage.getItem(consentKey)).toBe('declined')
    expect(screen.queryByRole('dialog')).toBeNull()
    view.unmount()
    render(<PrivacyControls />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Allow analytics' }))
    expect(localStorage.getItem(consentKey)).toBe('accepted')
})
it.each(['Allow analytics', 'Decline / revoke analytics', 'Close and decline analytics'])('keeps the banner and error visible when %s cannot persist', (name) => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    render(<PrivacyControls />)
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name }))
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toBeVisible()
    expect(localStorage.getItem(consentKey)).toBeNull()
})

it('dismisses a direct decline and keeps the choice across remount', () => {
    const view = render(<PrivacyControls />)
    fireEvent.click(screen.getByRole('button', { name: 'Decline / revoke analytics' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    view.unmount()
    render(<PrivacyControls />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(localStorage.getItem(consentKey)).toBe('declined')
})
