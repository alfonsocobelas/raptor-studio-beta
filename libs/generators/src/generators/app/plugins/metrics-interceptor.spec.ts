import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'

/**
 * TASK-03 (spec 51): el instrumentador. Interceptor propio (no se toca el LoggerInterceptor
 * del kernel: está congelado en la fixture de oro y el plugin es opcional), registrado como
 * APP_INTERCEPTOR, con el candado de cardinalidad: la etiqueta de ruta es la PLANTILLA
 * (/contracts/:id), nunca la URL cruda — prom-client fija las etiquetas en la primera
 * llamada y una URL con identificadores crea una serie temporal por registro.
 */
describe('plugin metrics — interceptor', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, plugins: 'metrics' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('emite el interceptor y lo registra como APP_INTERCEPTOR en su módulo', () => {
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/metrics/metrics.interceptor.ts')
    ).toBe(true)

    const module = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics.module.ts')
    expect(module).toContain('APP_INTERCEPTOR')
    expect(module).toContain('MetricsInterceptor')
  })

  it('mide las cuatro métricas HTTP', () => {
    const interceptor = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics.interceptor.ts')

    expect(interceptor).toContain("'http_requests_total'")
    expect(interceptor).toContain("'http_request_duration_seconds'")
    expect(interceptor).toContain("'http_requests_in_flight_started_total'")
    expect(interceptor).toContain("'http_requests_in_flight_finished_total'")
    expect(interceptor).toContain("'http_request_errors_total'")
  })

  it('candado de cardinalidad: etiqueta con la plantilla de ruta y cae a unknown', () => {
    const interceptor = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics.interceptor.ts')

    // la plantilla resuelta por el router (con :id), nunca originalUrl en las etiquetas
    expect(interceptor).toContain('request.route?.path')
    expect(interceptor).toContain("'unknown'")
    expect(interceptor).not.toMatch(/labels[^\n]*originalUrl/)
  })

  it('no toca el LoggerInterceptor del kernel', () => {
    const logger = read('libs/backend/src/contexts/shared/infrastructure/interceptors/logger.interceptor.ts')

    expect(logger).not.toContain('Metrics')
  })

  it('la duración se observa en segundos (convención Prometheus), no en milisegundos', () => {
    const interceptor = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics.interceptor.ts')

    expect(interceptor).toContain('/ 1000')
  })
})
