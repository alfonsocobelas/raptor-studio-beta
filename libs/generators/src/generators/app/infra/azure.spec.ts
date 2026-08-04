import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { INFRA } from './registry'
import { SLOTS } from '../plugins/slots'

/**
 * TASK-04 (spec 24): el proveedor azure devuelve al emitido lo que la base dejó de llevar,
 * pero solo cuando se pide — y esta vez con sus dependencias declaradas de verdad.
 */
describe('proveedor infra=azure', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'azure' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('está registrado como proveedor elegible de la ranura', () => {
    expect(Object.keys(INFRA)).toEqual(['none', 'azure'])
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none', 'azure'])
  })

  it('emite el resolver de secretos de Key Vault y el adapter de Blob', () => {
    expect(
      tree.exists(
        'apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-secret-resolver.ts'
      )
    ).toBe(true)
    expect(
      tree.exists(
        'apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-config-loader.ts'
      )
    ).toBe(true)
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/azure-blob-file-storage.ts')
    ).toBe(true)
  })

  it('declara las dependencias del SDK que sus ficheros importan', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

    expect(pkg.dependencies['@azure/identity']).toBeDefined()
    expect(pkg.dependencies['@azure/keyvault-secrets']).toBeDefined()
    expect(pkg.dependencies['@azure/storage-blob']).toBeDefined()
  })

  it('cambia el loader de config por el que resuelve vault.* contra Key Vault', () => {
    const configModule = read('libs/backend/src/contexts/shared/infrastructure/config/config.module.ts')

    expect(configModule).toContain("from './loaders/azure/azure-config-loader'")
    expect(configModule).not.toContain("from './loaders/config-loader'")
  })

  it('deja el resto del árbol igual que sin infra (el proveedor añade, no reescribe)', async () => {
    const plain: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(plain, { name: 'demo', models: 'contract', skipInstall: true })

    const azureOnly = tree
      .listChanges()
      .filter(change => !plain.exists(change.path))
      .map(change => change.path.replace('apps/demo/', ''))

    expect(azureOnly.sort()).toEqual([
      'libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-config-loader.ts',
      'libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-secret-resolver.ts',
      'libs/backend/src/contexts/shared/infrastructure/storage/azure-blob-file-storage.ts'
    ])
  })
})
