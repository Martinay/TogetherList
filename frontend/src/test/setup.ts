import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

vi.mock('react-i18next', () => ({
    useTranslation: () => {
        return {
            t: (str: string) => {
                // Return a mocked string for the test assertions to find
                if (str === 'landing.headline') return 'Create & Share Lists Instantly'
                if (str === 'landing.createButton') return 'Create New List'
                if (str === 'createList.step0Title') return 'Name your list'
                if (str === 'createList.step0Placeholder') return 'e.g., Weekend Trip'
                if (str === 'createList.step0Next') return 'Continue'
                return str
            },
            i18n: {
                changeLanguage: () => new Promise(() => {}),
                language: 'en',
                dir: () => 'ltr'
            },
        }
    },
    initReactI18next: {
        type: '3rdParty',
        init: () => {},
    }
}))
