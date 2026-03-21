import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
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
