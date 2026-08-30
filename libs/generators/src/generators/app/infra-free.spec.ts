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

  // infra=none es interno desde 2026-08-24 (el default pasó a raptor): se pide explícito
  // porque este spec vigila el KERNEL, y el kernel se mira sin el ruido de ningún adapter
  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'none' })
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
   * Spec 50: mismo candado para Raptor Cloud. Aquí no hay SDK que buscar (sus adapters
   * hablan HTTP), así que el candado mira los NOMBRES: si el loader de Infisical, el
   * transporte de Loki o el de Sentry se colaran en la base, aparecerían aquí.
   */
  it('ningún fichero nombra Infisical, Loki ni Sentry', () => {
    const offenders = emitted()
      .filter(file => /Infisical|INFISICAL_|LokiTransport|SentryTransport/.test(file.content))
      .map(file => file.path)

    expect(offenders).toEqual([])
  })

  it('el package.json no declara dependencias de los adapters de Raptor', () => {
    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const all = { ...pkg.dependencies, ...pkg.devDependencies }

    expect(Object.keys(all).filter(name => name.startsWith('@sentry/'))).toEqual([])
    expect(Object.keys(all).filter(name => name.includes('infisical'))).toEqual([])
  })

  /**
   * Spec 77: mismo candado para GCP. Aquí no hay excepción tipo SES: ningún plugin
   * aditivo declara SDKs de Google, así que una app sin infra no los nombra jamás.
   */
  it('ningún fichero importa un paquete @google-cloud/* ni el package.json lo declara', () => {
    const offenders = emitted()
      .filter(file => /from '@google-cloud\//.test(file.content))
      .map(file => file.path)
    expect(offenders).toEqual([])

    const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const all = { ...pkg.dependencies, ...pkg.devDependencies }
    expect(Object.keys(all).filter(name => name.startsWith('@google-cloud/'))).toEqual([])
  })

  /** Spec 50: sin infra elegida no hay nube que aprovisionar, así que tampoco IaC. */
  it('no emite directorio iac/', () => {
    expect(emitted().filter(file => file.path.startsWith('apps/demo/iac/'))).toEqual([])
  })

  /**
   * La excepción documentada: el plugin `email` declara @aws-sdk/client-ses A PROPÓSITO
   * (el factory carga el SDK perezosamente al activar la sección `ses`). Es del plugin,
   * no de la ranura infra: una app auth,email sin infra lo lleva, y solo ese.
   */
  it('auth,email sin infra lleva exactamente el SDK de SES (del plugin, no de la ranura)', async () => {
    const withEmail: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(withEmail, {
      name: 'demo',
      models: 'contract',
      skipInstall: true,
      infra: 'none',
      plugins: 'auth,email'
    })

    const pkg = JSON.parse(withEmail.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
      dependencies?: Record<string, string>
    }
    const awsDeps = Object.keys(pkg.dependencies ?? {}).filter(name => name.startsWith('@aws-sdk/'))

    expect(awsDeps).toEqual(['@aws-sdk/client-ses'])
  })

  /**
   * Spec 50, TASK-07: la composición que vende Raptor Cloud — infra + auth + email. Brevo
   * (capa gratuita) ya venía del plugin `email`; lo que se verifica aquí es que la ranura y
   * el plugin componen sin pisarse, que es lo único que esta spec podía romper.
   */
  it('raptor con auth,email compone: los emails salen por Brevo y los secretos por Infisical', async () => {
    const full: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(full, {
      name: 'demo',
      models: 'contract',
      skipInstall: true,
      infra: 'raptor',
      plugins: 'auth,email'
    })

    const configTypes =
      full.read('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/config-types.ts', 'utf-8') ?? ''
    const configModule =
      full.read('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/config.module.ts', 'utf-8') ?? ''

    expect(configTypes).toContain('BrevoConfig')
    expect(configTypes).toContain('LokiConfig')
    expect(configModule).toContain("from './loaders/infisical/infisical-config-loader'")
  })
})
