import { afterEach } from 'vitest'
import { sessions, capture } from './browser-helper'
afterEach(async context => {
    if (context.task.result?.state !== 'fail') return
    for (const browser of sessions) {
        await capture(browser, `failure-${context.task.name.replace(/[^a-z0-9]/gi, '-').slice(0, 100)}-${browser.sessionId}`)
    }
})
