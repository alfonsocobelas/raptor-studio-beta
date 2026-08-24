import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import angular from '@analogjs/vite-plugin-angular'
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

/**
 * Runner de los specs de frontend. El plugin de Angular es obligatorio para los tests que
 * RENDERIZAN un componente: sin él vitest pasa los .ts por esbuild, que borra los decoradores
 * sin generar metadata, y todo binding de input muere con NG0303. Y va apuntado a
 * `tsconfig.spec.json` a propósito: el tsconfig raíz solo incluye backend+shared, así que
 * mirando ahí el plugin no compilaría una sola línea del frontend.
 */
export default defineConfig({
  plugins: [angular({ tsconfig: 'tsconfig.spec.json' })],
  resolve: { alias },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['libs/frontend/src/**/*.spec.ts'],
    setupFiles: ['libs/frontend/src/test-setup.ts'],
    // TestBed exige un contexto de módulo nuevo por fichero (initTestEnvironment solo se llama
    // una vez por contexto); se fija explícitamente en vez de confiar en los defaults.
    pool: 'forks',
    isolate: true,
    // mismo margen que el jest emitido (30 s): con la máquina cargada, los 5 s por defecto
    // convierten tests correctos en timeouts
    testTimeout: 30000,
    server: {
      deps: {
        // los helm viajan como fuente TS: inline para que el plugin compile sus plantillas
        inline: [/libs\/ui\//, /@spartan-ng/]
      }
    }
  }
})
