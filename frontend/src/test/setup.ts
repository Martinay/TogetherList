import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
Object.defineProperty(globalThis, 'localStorage', { value: window.localStorage, configurable: true, writable: true })

import translations from '../../public/locales/en/translation.json'

/**
 * Resolve a dot-notation key (e.g. "landing.faq.title") from a nested object.
 * Supports basic {{variable}} interpolation used by i18next.
 */
function resolveKey(key: string, options?: Record<string, unknown>): string {
    const parts = key.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = translations
    for (const part of parts) {
        if (result == null || typeof result !== 'object') return key
        result = result[part]
    }
    if (typeof result !== 'string') return key

    // Handle {{variable}} interpolation
    if (options) {
        return result.replace(/\{\{(\w+)\}\}/g, (_, varName) =>
            options[varName] != null ? String(options[varName]) : `{{${varName}}}`
        )
    }
    return result
}

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: Record<string, unknown>) => resolveKey(key, options),
        i18n: {
            changeLanguage: () => new Promise(() => {}),
            language: 'en',
            dir: () => 'ltr',
            on: () => {},
            off: () => {},
        },
    }),
    // Support <I18nextProvider> used by IdentityPicker.test.tsx
    I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
    // Support <Trans> component if used anywhere
    Trans: ({ children }: { children: React.ReactNode }) => children,
    initReactI18next: {
        type: '3rdParty',
        init: () => {},
    },
}))

// Share lock queues across module reloads to model tabs using the same origin.
const lockQueues = new Map<string, Promise<unknown>>()
Object.defineProperty(navigator, 'locks', { configurable: true, value: {
    request: async (name: string, optionsOrWork: { ifAvailable?: boolean } | ((lock: object) => unknown), callback?: (lock: object | null) => unknown) => {
        const work = typeof optionsOrWork === 'function' ? optionsOrWork : callback!
        const previous = lockQueues.get(name)
        if (typeof optionsOrWork !== 'function' && optionsOrWork.ifAvailable && previous) return work(null!)
        const result = (previous || Promise.resolve()).then(() => work({ name }))
        lockQueues.set(name, result)
        try { return await result } finally { if (lockQueues.get(name) === result) lockQueues.delete(name) }
    },
} })
