import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { PLUGINS } from './registry'

/**
 * TASK-01 (spec 51): el plugin `metrics` — primer consumidor real del MetricsPort del
 * catálogo. Emite el adapter de Prometheus y su módulo; el endpoint y el interceptor
 * llegan en TASK-02/03.
 */
describe('plugin metrics', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, plugins: 'metrics' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('está registrado como plugin aditivo, detrás de email', () => {
    expect(Object.keys(PLUGINS)).toEqual(['email', 'metrics'])
  })

  it('emite el puerto de métricas y el adapter de Prometheus (mismo canon que el catálogo)', () => {
    expect(tree.exists('apps/demo/libs/backend/src/contexts/shared/domain/metrics/metrics.port.ts')).toBe(true)
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/metrics/prometheus-metrics.ts')
    ).toBe(true)

    const adapter = read('libs/backend/src/contexts/shared/infrastructure/metrics/prometheus-metrics.ts')
    expect(adapter).toContain('class PrometheusMetrics extends MetricsPort')
    expect(adapter).toContain("from 'prom-client'")
  })

  it('emite el MetricsModule global que provee el puerto', () => {
    const module = read('libs/backend/src/contexts/shared/infrastructure/metrics/metrics.module.ts')

    expect(module).toContain('@Global()')
    expect(module).toContain('provide: MetricsPort')
    expect(module).toContain('exports: [MetricsPort]')
  })

  it('registra el módulo en el root, junto a los del kernel', () => {
    const root = read('libs/backend/src/root.module.ts')

    expect(root).toContain("from './contexts/shared/infrastructure/metrics/metrics.module'")
    // DENTRO del array imports, no solo la línea de import: en una app pequeña prettier
    // deja el array en una línea y un parche que asuma la forma multilínea lo deja fuera
    // (bug real cazado por la verificación manual de TASK-06)
    const importsArray = root.match(/imports: \[[^\]]*\]/s)?.[0] ?? ''
    expect(importsArray).toContain('MetricsModule')
  })

  /**
   * La forma que ve el plugin cuando corre por CLI: el root.module ya prettificado, con el
   * array imports colapsado en UNA línea (con pocos modelos cabe en printWidth 120). El
   * ancla del parche no puede asumir la forma cruda multilínea del árbol de test — este
   * escenario es el que se rompió en la verificación manual de TASK-06.
   */
  it('registra el módulo también sobre un root.module ya prettificado (imports en una línea)', () => {
    const formatted = createTreeWithEmptyWorkspace()
    const rootPath = 'apps/demo/libs/backend/src/root.module.ts'
    formatted.write(
      rootPath,
      `import { Module } from '@nestjs/common'
import { CoreConfigModule } from './contexts/shared/infrastructure/config/config.module'
import { LoggerModule } from './contexts/shared/infrastructure/logger/logger.module'
import { ContractsModule } from './contexts/sap-licensing/modules/contracts/contracts.module'

@Module({
  imports: [CoreConfigModule, LoggerModule, SharedPersistenceModule, HealthModule, ContractsModule],
  providers: []
})
export class RootModule {}
`
    )

    PLUGINS['metrics'].apply?.(formatted, {
      root: 'apps/demo',
      appName: 'demo',
      backendSrc: 'apps/demo/libs/backend/src',
      frontendSrc: 'apps/demo/libs/frontend/src',
      models: [],
      scope: '@app'
    })

    const patched = formatted.read(rootPath, 'utf-8') ?? ''
    const importsArray = patched.match(/imports: \[[^\]]*\]/s)?.[0] ?? ''
    expect(importsArray).toContain('MetricsModule')
  })

  it('declara prom-client con la misma versión que el canon del catálogo', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }
    const catalog = JSON.parse(
      require('fs').readFileSync(require('path').join(__dirname, '../../../../../../libs/infra/metrics-prometheus/package.json'), 'utf-8')
    ) as { dependencies: Record<string, string> }

    expect(pkg.dependencies['prom-client']).toBe(catalog.dependencies['prom-client'])
  })

  it('añade la sección metrics a los tipos y la validación de config', () => {
    const types = read('libs/backend/src/contexts/shared/infrastructure/config/config-types.ts')
    const validation = read('libs/backend/src/contexts/shared/infrastructure/config/config-validation.ts')

    expect(types).toContain('metrics?: MetricsConfig')
    expect(types).toContain('token: string')
    expect(validation).toContain('MetricsValidator')
  })

  it('una app sin el plugin no lleva nada de métricas', async () => {
    const plain: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(plain, { name: 'demo', models: 'contract', skipInstall: true })

    const offenders = plain
      .listChanges()
      .filter(change => change.path.startsWith('apps/demo/'))
      .filter(change => {
        const content = change.content?.toString('utf-8') ?? ''
        return /prom-client|PrometheusMetrics|MetricsModule/.test(content)
      })
      .map(change => change.path)

    expect(offenders).toEqual([])
  })
})
