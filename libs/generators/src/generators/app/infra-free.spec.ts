import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * TASK-01/02 (spec 24): el candado que faltaba. Una app sin infraestructura elegida NO
 * puede arrastrar Azure — y hoy lo arrastra: el logger, los loaders de config y el adapter
 * de Blob se emiten siempre, importando `@azure/*` sin declararlo en el package.json.
 *
 * El golden no lo veía (compara ficheros, y esos ficheros estaban congelados en la fixture)
 * y la suite del plugin tampoco (no compila lo emitido). De ahí este test.
 */
describe('app generator — una app sin infra no lleva Azure dentro', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true })
  })

  const emitted = (): { path: string; content: string }[] =>
    tree
      .listChanges()
      .filter(change => change.path.startsWith('apps/demo/'))
      .map(change => ({ path: change.path, content: change.content?.toString('utf-8') ?? '' }))

  it('ningún fichero importa un paquete @azure/*', () => {
    const offenders = emitted()
      .filter(file => /from '@azure\//.test(file.content))
      .map(file => file.path)

    expect(offenders).toEqual([])
  })

  it('ningún fichero nombra clases o rutas de Azure', () => {
    const offenders = emitted()
      .filter(file => /\bAzure[A-Z]/.test(file.content) || /\/azure\//.test(file.content))
      .map(file => file.path)

    expect(offenders).toEqual([])
  })

  it('el package.json no declara dependencias de Azure', () => {
    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const all = { ...pkg.dependencies, ...pkg.devDependencies }

    expect(Object.keys(all).filter(name => name.startsWith('@azure/'))).toEqual([])
  })

  /** Spec 47: mismo candado para AWS — la ranura infra no puede filtrar su SDK a la base. */
  it('ningún fichero importa un paquete @aws-sdk/* ni el package.json lo declara', () => {
    const offenders = emitted()
      .filter(file => /from '@aws-sdk\//.test(file.content))
      .map(file => file.path)
    expect(offenders).toEqual([])

    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(all).filter(name => name.startsWith('@aws-sdk/'))).toEqual([])
  })

  /**
   * La excepción documentada: el plugin `email` declara @aws-sdk/client-ses A PROPÓSITO
   * (el factory carga el SDK perezosamente al activar la sección `ses`). Es del plugin,
   * no de la ranura infra: una app auth,email sin infra lo lleva, y solo ese.
   */
  it('auth,email sin infra lleva exactamente el SDK de SES (del plugin, no de la ranura)', async () => {
    const withEmail: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(withEmail, { name: 'demo', models: 'contract', skipInstall: true, plugins: 'auth,email' })

    const pkg = JSON.parse(withEmail.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies?: Record<string, string>
    }
    const awsDeps = Object.keys(pkg.dependencies ?? {}).filter(name => name.startsWith('@aws-sdk/'))

    expect(awsDeps).toEqual(['@aws-sdk/client-ses'])
  })
})
