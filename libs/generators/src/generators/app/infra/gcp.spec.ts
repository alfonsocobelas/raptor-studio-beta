import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { INFRA } from './registry'
import { SLOTS } from '../plugins/slots'

/**
 * TASK-02 (spec 77): el proveedor gcp — espejo del aws de la spec 47. Los secretos
 * `vault.*` se resuelven contra Secret Manager con el prefijo de GCP_SECRETS_PREFIX
 * (el contrato de nombres lo fijó iac/gcp: ids `${name}-typeorm-*` con guiones).
 */
describe('proveedor infra=gcp', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'gcp' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('está registrado como proveedor elegible de la ranura, detrás de raptor', () => {
    expect(Object.keys(INFRA)).toEqual(['none', 'azure', 'aws', 'raptor', 'gcp'])
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none', 'azure', 'aws', 'raptor', 'gcp'])
  })

  it('emite el resolver de secretos de Secret Manager y su config loader', () => {
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/gcp/gcp-secret-resolver.ts')
    ).toBe(true)
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/gcp/gcp-config-loader.ts')
    ).toBe(true)
  })

  it('declara la dependencia del SDK que sus ficheros importan', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

    expect(pkg.dependencies['@google-cloud/secret-manager']).toBeDefined()
  })

  it('cambia el loader de config por el que resuelve vault.* contra Secret Manager', () => {
    const configModule = read('libs/backend/src/contexts/shared/infrastructure/config/config.module.ts')

    expect(configModule).toContain("from './loaders/gcp/gcp-config-loader'")
    expect(configModule).not.toContain("from './loaders/config-loader'")
  })

  it('el resolver antepone el prefijo de GCP_SECRETS_PREFIX y aplana vault.* con guiones', () => {
    const resolver = read('libs/backend/src/contexts/shared/infrastructure/config/loaders/gcp/gcp-secret-resolver.ts')

    expect(resolver).toContain('GCP_SECRETS_PREFIX')
    expect(resolver).toContain("replace(/\\./g, '-')")
    expect(resolver).toContain('SecretResolutionError')
  })

  it('el proyecto sale de las credenciales (ADC), nunca de la config', () => {
    const resolver = read('libs/backend/src/contexts/shared/infrastructure/config/loaders/gcp/gcp-secret-resolver.ts')

    expect(resolver).toContain('getProjectId()')
    expect(resolver).toContain('/versions/latest')
  })
})
