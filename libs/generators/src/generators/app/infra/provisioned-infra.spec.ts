import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'

/**
 * TASK-01 (spec 62): hay clientes que aprovisionan su propia infraestructura. Con
 * `provisionedInfra` la app emitida conserva los adapters de la nube elegida pero
 * no lleva ni un fichero de Terraform: aplicar IaC contra una suscripción que no
 * controlamos no es una opción.
 */
describe('opción provisionedInfra', () => {
  describe('con infra=azure y provisionedInfra', () => {
    let tree: Tree

    beforeAll(async () => {
      tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, {
        name: 'demo',
        models: 'contract',
        skipInstall: true,
        infra: 'azure',
        provisionedInfra: true
      })
    })

    it('no emite ningún fichero bajo iac/', () => {
      expect(tree.exists('apps/demo/iac')).toBe(false)
      expect(tree.children('apps/demo').some(entry => entry === 'iac')).toBe(false)
    })

    it('conserva los adapters y las dependencias del proveedor', () => {
      expect(
        tree.exists(
          'apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-secret-resolver.ts'
        )
      ).toBe(true)
      expect(
        tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/azure-blob-file-storage.ts')
      ).toBe(true)

      const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}') as {
        dependencies: Record<string, string>
      }
      expect(pkg.dependencies['@azure/identity']).toBeDefined()
      expect(pkg.dependencies['@azure/storage-blob']).toBeDefined()
    })
  })

  it('sin el flag, el proveedor sigue emitiendo su iac/ (sin regresión)', async () => {
    const tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'azure' })

    expect(tree.exists('apps/demo/iac/main.tf')).toBe(true)
  })

  /**
   * TASK-02: el `apply()` de cada proveedor toca ficheros de iac/ (nameTerraformProject);
   * estos tests fijan que la generación completa tolera su ausencia en los tres.
   */
  describe.each([
    { infra: 'aws', adapter: 'libs/backend/src/contexts/shared/infrastructure/storage/s3-file-storage.ts' },
    { infra: 'raptor', adapter: 'libs/backend/src/contexts/shared/infrastructure/logger/loki-transport.ts' }
  ])('con infra=$infra y provisionedInfra', ({ infra, adapter }) => {
    let tree: Tree

    beforeAll(async () => {
      tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, {
        name: 'demo',
        models: 'contract',
        skipInstall: true,
        infra,
        provisionedInfra: true
      })
    })

    it('genera sin reventar y sin ningún fichero bajo iac/', () => {
      expect(tree.exists('apps/demo/iac')).toBe(false)
    })

    it('conserva los adapters del proveedor', () => {
      expect(tree.exists(`apps/demo/${adapter}`)).toBe(true)
    })
  })

  it('con infra=none el flag es un no-op silencioso', async () => {
    const tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, {
      name: 'demo',
      models: 'contract',
      skipInstall: true,
      infra: 'none',
      provisionedInfra: true
    })

    expect(tree.exists('apps/demo/iac')).toBe(false)
  })
})
