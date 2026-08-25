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

  /**
   * TASK-04: candado y composición. Sin el plugin, ni rastro de métricas; con auth al lado,
   * el guard de sesión (global) y el de token (del controller) conviven — @Public() exime de
   * la sesión al raspador y el token sigue delante.
   */
  describe('candado y composición', () => {
    it('una app sin el plugin no nombra prom-client ni /metrics en ningún fichero', async () => {
      const plain: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(plain, { name: 'demo', models: 'contract', skipInstall: true })

      const offenders = plain
        .listChanges()
        .filter(change => change.path.startsWith('apps/demo/'))
        .filter(change =>
          /prom-client|MetricsInterceptor|MetricsTokenGuard/.test(change.content?.toString('utf-8') ?? '')
        )
        .map(change => change.path)
      expect(offenders).toEqual([])

      const pkg = JSON.parse(plain.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
        dependencies?: Record<string, string>
      }
      expect(pkg.dependencies?.['prom-client']).toBeUndefined()
    })

    it('auth,email,metrics compone: sesión global, token en el controller y Public del kernel', async () => {
      const full: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(full, {
        name: 'demo',
        models: 'contract',
        skipInstall: true,
        plugins: 'auth,email,metrics'
      })

      const controller =
        full.read('apps/demo/libs/backend/src/contexts/shared/infrastructure/metrics/metrics.controller.ts', 'utf-8') ??
        ''
      const authModule = full.read('apps/demo/libs/backend/src/contexts/iam/modules/auth/auth.module.ts', 'utf-8') ?? ''

      // el decorador que lee el SessionGuard es el mismo que importa el controller
      expect(controller).toContain("from '../auth/public.decorator'")
      expect(controller).toContain('@UseGuards(MetricsTokenGuard)')
      expect(authModule).toContain('APP_GUARD')
    })
  })
})
