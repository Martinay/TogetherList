/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss(), {
        name: 'offline-shell-manifest',
        generateBundle(_options, bundle) {
            const assets = Object.keys(bundle).filter(name => name.startsWith('assets/')).map(name => `/${name}`)
            const languages = ['en', 'ar', 'hi', 'es', 'fr', 'bn', 'pt', 'id', 'ru', 'de', 'ja', 'tr', 'vi', 'it', 'pl', 'uk', 'nl', 'el', 'hu', 'sv', 'cs']
            const translations = languages.map(lang => readFileSync(`public/locales/${lang}/translation.json`, 'utf8')).join('')
            const revision = createHash('sha256').update(JSON.stringify(assets) + translations).digest('hex')
            const worker = readFileSync('src/features/offline/service-worker.js', 'utf8').replace('togetherlist-shell-v1', `togetherlist-shell-${revision}`)
            this.emitFile({ type: 'asset', fileName: 'sw.js', source: worker })
            this.emitFile({ type: 'asset', fileName: 'offline-shell.json', source: JSON.stringify(['/index.html', ...assets, ...languages.map(lang => `/locales/${lang}/translation.json`)]) })
        },
    }],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['src/test/e2e/**'],
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
        },
    },
})
