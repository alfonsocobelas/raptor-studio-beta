import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { INFRA } from './registry'
import { SLOTS } from '../plugins/slots'

/**
 * TASK-02 (spec 47): el proveedor aws — espejo del azure de la spec 24. Los secretos
 * `vault.*` se resuelven contra Secrets Manager con el prefijo de AWS_SECRETS_PREFIX.
 */
describe('proveedor infra=aws', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'aws' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('está registrado como proveedor elegible de la ranura, detrás de azure', () => {
    expect(Object.keys(INFRA)).toEqual(['none', 'azure', 'aws'])
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none', 'azure', 'aws'])
  })

  it('emite el resolver de secretos de Secrets Manager y su config loader', () => {
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/aws/aws-secret-resolver.ts')
    ).toBe(true)
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/aws/aws-config-loader.ts')
    ).toBe(true)
  })

  it('declara la dependencia del SDK que sus ficheros importan', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

    expect(pkg.dependencies['@aws-sdk/client-secrets-manager']).toBeDefined()
  })

  it('cambia el loader de config por el que resuelve vault.* contra Secrets Manager', () => {
    const configModule = read('libs/backend/src/contexts/shared/infrastructure/config/config.module.ts')

    expect(configModule).toContain("from './loaders/aws/aws-config-loader'")
    expect(configModule).not.toContain("from './loaders/config-loader'")
  })

  it('el resolver antepone el prefijo de AWS_SECRETS_PREFIX y aplana vault.* con guiones', () => {
    const resolver = read('libs/backend/src/contexts/shared/infrastructure/config/loaders/aws/aws-secret-resolver.ts')

    expect(resolver).toContain('AWS_SECRETS_PREFIX')
    expect(resolver).toContain("replace(/\\./g, '-')")
    expect(resolver).toContain('SecretResolutionError')
  })
})
