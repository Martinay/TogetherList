import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PullToRefresh } from '../features/view-list/pull-to-refresh'

const touch = (y: number, x = 20, identifier = 1) => ({ clientY: y, clientX: x, identifier })
function start(target: Element) { fireEvent.touchStart(target, { touches: [touch(20)] }) }
function move(target: Element, y: number, x = 20) { return fireEvent.touchMove(target, { touches: [touch(y, x)] }) }
function end(target: Element) { fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(110)] }) }
function setup(refresh = vi.fn().mockResolvedValue(undefined)) {
    render(<PullToRefresh onRefresh={refresh}><div data-testid="surface">Items</div><button>Item action</button><input aria-label="Edit" /></PullToRefresh>)
    return { target: screen.getByTestId('surface'), refresh }
}
afterEach(() => { document.documentElement.scrollTop = 0 })

it('does not refresh after a pull is reversed back below the threshold', async () => {
    const { target, refresh } = setup()
    start(target); move(target, 110); move(target, 25); end(target)
    await act(async () => {})
    expect(refresh).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it.each(['short', 'up', 'horizontal', 'cancel', 'multi', 'scroll', 'control', 'changedScroll'])('leaves %s gestures alone', async kind => {
    const { target, refresh } = setup()
    const surface = kind === 'control' ? screen.getByRole('button') : target
    if (kind === 'scroll') document.documentElement.scrollTop = 50
    start(surface)
    if (kind === 'changedScroll') document.documentElement.scrollTop = 50
    if (kind === 'multi') fireEvent.touchMove(surface, { touches: [touch(110), touch(110, 30, 2)] })
    else move(surface, kind === 'short' ? 91 : kind === 'up' ? 0 : 110, kind === 'horizontal' ? 150 : 20)
    if (kind === 'cancel') fireEvent.touchCancel(surface)
    end(surface)
    await act(async () => {})
    expect(refresh).not.toHaveBeenCalled()
})

it('reserves the first small downward move before showing feedback, then completes a full pull', async () => {
    const { target, refresh } = setup()
    start(target)
    expect(move(target, 21)).toBe(false)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(move(target, 30)).toBe(false)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(move(target, 92)).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent('Release to refresh')
    end(target)
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
})

it.each(['stationary', 'horizontal', 'upward', 'interactive', 'scrolled', 'noncancelable'])('preserves the first small %s move', async kind => {
    const { target, refresh } = setup()
    const surface = kind === 'interactive' ? screen.getByRole('button') : target
    if (kind === 'scrolled') target.scrollTop = 1
    start(surface)
    expect(fireEvent.touchMove(surface, {
        touches: [touch(kind === 'stationary' ? 20 : kind === 'upward' ? 19 : 21, kind === 'horizontal' ? 22 : 20)],
        cancelable: kind !== 'noncancelable',
    })).toBe(true)
    end(surface)
    await act(async () => {})
    expect(refresh).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('prevents only an accepted downward gesture and refreshes once while pending', async () => {
    let resolve!: () => void
    const { target, refresh } = setup(vi.fn(() => new Promise<void>(done => { resolve = done })))
    start(target)
    expect(move(target, 25)).toBe(false)
    expect(move(target, 92)).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent('Release to refresh')
    end(target)
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    start(target); move(target, 110); end(target)
    expect(refresh).toHaveBeenCalledTimes(1)
    await act(async () => resolve())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    start(target); move(target, 110); end(target)
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2))
    await act(async () => resolve())
})

it('keeps children on failure, clears busy and permits retry', async () => {
    const { target, refresh } = setup(vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined))
    start(target); move(target, 110); end(target)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Failed'))
    expect(target).toBeInTheDocument()
    start(target); move(target, 110); end(target)
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
})

it('does not expose an idle status region that masks offline feedback', () => {
    setup()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('ignores nested scrollers and editable fields without preventing their touch moves', async () => {
    const { target, refresh } = setup()
    target.scrollTop = 20
    start(target)
    expect(move(target, 110)).toBe(true)
    end(target)
    const input = screen.getByRole('textbox')
    start(input)
    expect(move(input, 110)).toBe(true)
    end(input)
    await act(async () => {})
    expect(refresh).not.toHaveBeenCalled()
})

it('restores native overscroll and ignores a refresh settlement after unmount', async () => {
    document.documentElement.style.overscrollBehaviorY = 'auto'
    let reject!: (error: Error) => void
    const refresh = vi.fn(() => new Promise<void>((_, fail) => { reject = fail }))
    const { unmount } = render(<PullToRefresh onRefresh={refresh}><div data-testid="surface">Items</div></PullToRefresh>)
    const target = screen.getByTestId('surface')
    expect(document.documentElement.style.overscrollBehaviorY).toBe('contain')
    start(target); move(target, 110); end(target)
    await act(async () => {})
    unmount()
    await act(async () => reject(new Error('network')))
    expect(document.documentElement.style.overscrollBehaviorY).toBe('auto')
    document.documentElement.style.overscrollBehaviorY = ''
})

it.each(['remaining', 'otherIdentifier', 'outsideOriginalFirst', 'outsideSecondFirst'])('cancels an armed pull for %s touches', async kind => {
    const { target, refresh } = setup()
    start(target); move(target, 110)
    if (kind.startsWith('outside')) {
        fireEvent.touchStart(document.body, { touches: [touch(110), touch(20, 30, 2)], changedTouches: [touch(20, 30, 2)] })
        if (kind === 'outsideSecondFirst') {
            fireEvent.touchEnd(document.body, { touches: [touch(110)], changedTouches: [touch(20, 30, 2)] })
            end(target)
        } else {
            fireEvent.touchEnd(target, { touches: [touch(20, 30, 2)], changedTouches: [touch(110)] })
        }
    } else {
        fireEvent.touchEnd(target, {
            touches: kind === 'remaining' ? [touch(20, 30, 2)] : [],
            changedTouches: [touch(110, 20, kind === 'otherIdentifier' ? 2 : 1)],
        })
    }
    await act(async () => {})
    expect(refresh).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    start(target); move(target, 110); end(target)
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
})
