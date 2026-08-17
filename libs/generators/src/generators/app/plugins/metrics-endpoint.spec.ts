import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'

/**
 * TASK-02 (spec 51): exponer sin regalar. El endpoint /metrics existe solo con la sección
 * de config presente (fallo cerrado), exige el token de esa sección y NUNCA es público:
 * la exposición de Prometheus enseña rutas, volúmenes y nombres internos.
 */
describe('plugin metrics — endpoint', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, plugins: 'metrics' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('emite el controller y el guard del token', () => {
    expect(tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/metrics/metrics.controller.ts')).toBe(
      true
    )
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/metrics/metrics-token.guard.ts')
    ).toBe(true)
  })

  it('el controller sirve el render del puerto tras el guard de token', () => {
    const controller = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics.controller.ts')

    expect(controller).toContain('render()')
    expect(controller).toContain('@UseGuards(MetricsTokenGuard)')
  })

  /**
   * @Public() exime SOLO del guard de sesión: el raspador es una máquina y no puede iniciar
   * sesión, así que sin él una app con auth tendría un /metrics inservible. No abre nada:
   * el guard de token va delante, y esa pareja es la protección real del endpoint.
   */
  it('es Public para la sesión pero nunca sin su guard de token', () => {
    const controller = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics.controller.ts')
    const publicIndex = controller.indexOf('@Public()')
    const guardIndex = controller.indexOf('@UseGuards(MetricsTokenGuard)')

    expect(publicIndex).toBeGreaterThan(-1)
    expect(guardIndex).toBeGreaterThan(-1)
  })

  it('fallo cerrado: sin sección metrics el módulo no registra el controller', () => {
    const module = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics.module.ts')

    // el controller se decide por config en el arranque, no incondicionalmente
    expect(module).toContain("loadRawConfig()['metrics']")
    expect(module).toMatch(/controllers: .+\? \[MetricsController\] : \[\]/)
  })

  it('el guard compara en tiempo constante, no con ===', () => {
    const guard = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics-token.guard.ts')

    expect(guard).toContain('timingSafeEqual')
    expect(guard).not.toMatch(/provided\s*===\s*expected/)
  })

  it('el guard exige el esquema Bearer y rechaza sin cabecera', () => {
    const guard = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics-token.guard.ts')

    expect(guard).toContain("'Bearer '")
    expect(guard).toContain('UnauthorizedException')
  })
})
