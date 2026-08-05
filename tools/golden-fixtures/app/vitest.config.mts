import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Los alias se DERIVAN del tsconfig: los helm de Spartan son fuente vendorizada
 * (libs/ui/*), no un paquete de npm, así que sin alias vitest no resuelve
 * `@spartan-ng/helm/*`. Mantener la lista a mano en dos ficheros garantizaba que
 * se desincronizaran.
 */
const tsconfig = JSON.parse(readFileSync(new URL('./tsconfig.base.json', import.meta.url), 'utf-8')) as {
  compilerOptions: { paths: Record<string, string[]> }
}

const alias = Object.fromEntries(
  Object.entries(tsconfig.compilerOptions.paths)
    .filter(([pattern]) => !pattern.endsWith('/*'))
    .map(([pattern, [target]]) => [pattern, fileURLToPath(new URL(`./${target}`, import.meta.url))])
)

// Runner de los specs de frontend (servicios sin template: esbuild basta, sin compilador Angular).
export default defineConfig({
  resolve: { alias },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['libs/frontend/src/**/*.spec.ts'],
    setupFiles: ['libs/frontend/src/test-setup.ts']
  }
})
