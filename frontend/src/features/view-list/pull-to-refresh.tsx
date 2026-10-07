import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const threshold = 72

function atTop(target: Element) {
    if (window.scrollY > 0) return false
    for (let node: Element | null = target; node; node = node.parentElement) {
        if (node.scrollTop > 0) return false
    }
    return true
}

export function PullToRefresh({ children, onRefresh }: { children: ReactNode, onRefresh: () => Promise<void> }) {
    const { t } = useTranslation()
    const root = useRef<HTMLDivElement>(null)
    const busy = useRef(false)
    const [distance, setDistance] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        const element = root.current!
        // Native page refresh would bypass the offline synchronization path.
        const previousOverscroll = document.documentElement.style.overscrollBehaviorY
        document.documentElement.style.overscrollBehaviorY = 'contain'
        let start: { x: number, y: number, id: number, target: Element } | null = null
        let pulled = 0
        let mounted = true
        const reset = () => { start = null; pulled = 0; setDistance(0) }
        const begin = (event: TouchEvent) => {
            reset()
            const target = event.target as Element
            if (busy.current || event.touches.length !== 1 || !atTop(target) ||
                target.closest('button, input, textarea, select, a, label, [role="button"], [contenteditable], [tabindex]')) return
            const touch = event.touches[0]
            if (!touch) return
            start = { x: touch.clientX, y: touch.clientY, id: touch.identifier, target }
        }
        const move = (event: TouchEvent) => {
            if (!start) return
            const touch = event.touches[0]
            if (event.touches.length !== 1 || !touch || touch.identifier !== start.id || !atTop(start.target)) { reset(); return }
            const dy = touch.clientY - start.y
            const dx = Math.abs(touch.clientX - start.x)
            if (dy < 0 || (dx > 0 && dx >= dy)) { reset(); return }
            if (dy === 0) { pulled = 0; setDistance(0); return }
            if (!event.cancelable) { reset(); return }
            // Reserve scrolling before visual slop so later moves remain cancelable.
            event.preventDefault()
            if (dy <= 10) { pulled = 0; setDistance(0); return }
            pulled = dy
            setDistance(Math.min(dy, threshold))
        }
        const cancelAdditionalTouches = (event: TouchEvent) => {
            if (start && event.touches.length !== 1) reset()
        }
        const end = (event: TouchEvent) => {
            const activate = !!start && event.touches.length === 0 &&
                event.changedTouches.length === 1 && event.changedTouches[0]?.identifier === start.id &&
                pulled >= threshold && atTop(start.target)
            reset()
            if (!activate || busy.current) return
            busy.current = true
            setRefreshing(true)
            setFailed(false)
            void Promise.resolve().then(onRefresh).catch(() => { if (mounted) setFailed(true) }).finally(() => {
                busy.current = false
                if (mounted) setRefreshing(false)
            })
        }
        document.addEventListener('touchstart', cancelAdditionalTouches, { capture: true, passive: true })
        element.addEventListener('touchstart', begin, { passive: true })
        element.addEventListener('touchmove', move, { passive: false })
        element.addEventListener('touchend', end)
        element.addEventListener('touchcancel', reset)
        return () => {
            document.documentElement.style.overscrollBehaviorY = previousOverscroll
            mounted = false
            document.removeEventListener('touchstart', cancelAdditionalTouches, true)
            element.removeEventListener('touchstart', begin)
            element.removeEventListener('touchmove', move)
            element.removeEventListener('touchend', end)
            element.removeEventListener('touchcancel', reset)
        }
    }, [onRefresh])

    return <div ref={root} className="flex-1 flex flex-col" aria-busy={refreshing}>
        <div role={refreshing || distance || failed ? 'status' : undefined} className="text-center text-sm text-text-secondary" style={{ minHeight: refreshing || distance ? 40 : 0 }}>
            {refreshing ? t('list.loading') : distance >= threshold ? t('list.pullRelease') : distance ? t('list.pullHint') : failed ? t('list.error') : ''}
        </div>
        {children}
    </div>
}
