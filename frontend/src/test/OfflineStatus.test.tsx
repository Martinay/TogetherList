import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import OfflineStatus from '../features/offline/OfflineStatus'
import { loadList, mutateList, replay, syncStatus } from '../features/offline/store'

beforeEach(() => {
    localStorage.clear()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ name: 'Test list', participants: ['Alex'], items: {} }))))
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

it('shows HTTP rejection details and confirms discard before offering a corrected edit', async () => {
    await loadList('ui-list')
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await mutateList('/list/ui-list/items', 'POST', { title: '', createdBy: 'Alex' })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    vi.mocked(fetch).mockImplementation(async (_url, options) => options?.method
        ? new Response('Title is required', { status: 400 })
        : new Response(JSON.stringify({ name: 'Test list', participants: ['Alex'], items: {} })))
    await replay()
    render(<OfflineStatus />)
    expect(screen.getByText('Rejected (HTTP 400): Title is required')).toBeInTheDocument()
    expect(screen.getByText('Test list')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Apply saved edits over shared values' })).not.toBeInTheDocument()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    fireEvent.click(screen.getByRole('button', { name: 'Discard edit and dependent item edits' }))
    expect(syncStatus().pending).toBe(1)
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Discard edit and dependent item edits' }))
    await waitFor(() => expect(syncStatus().pending).toBe(0))
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Later independent edits will be retained'))
})

it('displays explicit browser support requirements even when online with no pending edits', () => {
    const locks = navigator.locks
    Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined })
    try {
        render(<OfflineStatus />)
        expect(screen.getByRole('status')).toHaveTextContent('List edits require a browser with Web Locks')
        expect(screen.getByRole('status')).toHaveTextContent('Reading remains available')
    } finally { Object.defineProperty(navigator, 'locks', { configurable: true, value: locks }) }
})

it('provides every recovery label and interpolation in all supported translations', () => {
    for (const lang of readdirSync('public/locales')) {
        const strings = JSON.parse(readFileSync(`public/locales/${lang}/translation.json`, 'utf8')).offline
        for (const key of ['unsupported', 'rejected', 'fieldConflict', 'recovery', 'discard', 'discardConfirm']) {
            expect(strings[key], `${lang}.${key}`).toBeTypeOf('string')
            expect(strings[key].length).toBeGreaterThan(0)
        }
        expect(strings.rejected).toContain('{{status}}')
    }
})
