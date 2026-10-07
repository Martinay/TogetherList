/* API data is managed by the durable snapshot/outbox, never by HTTP caching. */
const CACHE = 'togetherlist-shell-v1'
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const response = await fetch('/offline-shell.json', { cache: 'no-store' })
        if (!response.ok) throw new Error('Offline shell manifest unavailable')
        const paths = await response.json()
        const cache = await caches.open(CACHE)
        await cache.addAll(paths)
    })())
})
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys()
        await Promise.all(keys.filter(key => key.startsWith('togetherlist-shell-') && key !== CACHE).map(key => caches.delete(key)))
        await self.clients.claim()
    })())
})
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url)
    if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return
    const navigation = event.request.mode === 'navigate'
    if (!navigation && !/^\/(assets|locales)\//.test(url.pathname)) return
    event.respondWith((async () => {
        const cache = await caches.open(CACHE)
        try {
            const response = await fetch(event.request)
            if (response.ok && response.type === 'basic') {
                await cache.put(navigation ? '/index.html' : event.request, response.clone())
            }
            return response
        } catch (error) {
            const cached = await cache.match(navigation ? '/index.html' : event.request)
            if (cached) return cached
            throw error
        }
    })())
})
