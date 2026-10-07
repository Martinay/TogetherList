import config from './vitest.e2e.config'
export default { ...config, test: { ...config.test, include: ['src/test/e2e/offline.production.test.ts'] } }
