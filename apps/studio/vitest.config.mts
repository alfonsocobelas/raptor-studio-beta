import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Runner de los specs de frontend (servicios sin template: esbuild basta, sin compilador Angular).
export default defineConfig({
  resolve: {
    alias: [
      // En tests, los paquetes @raptor/* se resuelven a los FUENTES del monorepo (Vite compila el
      // TS directo); el build Angular usa los dist por file: — mismo código, dos resoluciones.
      // El deep-path va antes que el paquete raíz (orden de matching de Vite).
      {
        find: /^@raptor\/generators\/src\/(.*)$/,
        replacement: fileURLToPath(new URL('../../libs/generators/src/', import.meta.url)) + '$1'
      },
      { find: '@raptor/schema', replacement: fileURLToPath(new URL('../../libs/schema/src/index.ts', import.meta.url)) },
      // La librería de componentes vive en el propio repo (libs/ui/<nombre>), igual que
      // en el build: sin esto, montar un componente que use spartan no resuelve.
      {
        find: /^@spartan-ng\/helm\/(.*)$/,
        replacement: fileURLToPath(new URL('./libs/ui/', import.meta.url)) + '$1/src/index.ts'
      },
      {
        find: '@app/shared/domain',
        replacement: fileURLToPath(new URL('./libs/shared/domain/src/index.ts', import.meta.url))
      }
    ]
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['libs/frontend/src/**/*.spec.ts', 'libs/shared/domain/src/**/*.spec.ts'],
    setupFiles: ['libs/frontend/src/test-setup.ts']
  }
})
