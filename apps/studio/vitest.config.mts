import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Runner de los specs de frontend (servicios sin template: esbuild basta, sin compilador Angular).
export default defineConfig({
  resolve: {
    alias: {
      '@app/shared/domain': fileURLToPath(new URL('./libs/shared/domain/src/index.ts', import.meta.url))
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['libs/frontend/src/**/*.spec.ts'],
    setupFiles: ['libs/frontend/src/test-setup.ts']
  }
})
