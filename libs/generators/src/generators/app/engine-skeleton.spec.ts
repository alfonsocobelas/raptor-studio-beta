import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * TASK-09 (spec 06): lo que el esqueleto tiene de específico del motor — el compose de la
 * base y el arranque de la suite de integración — deja de copiarse siempre y lo declara el
 * manifiesto. Antes una app mongo salía con contenedores de Postgres y un arranger TypeORM.
 */
describe('app generator — el esqueleto específico del motor', () => {
  const emit = async (database?: 'postgres' | 'mongo'): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'customer', skipInstall: true, database })
    return tree
  }

  const read = (tree: Tree, file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  describe('postgres', () => {
    it('levanta Postgres en local y en test, y arranca la integración con TypeORM', async () => {
      const tree = await emit('postgres')

      expect(read(tree, 'docker/docker-compose.local.yml')).toContain('postgres:16-alpine')
      expect(read(tree, 'docker/docker-compose.test.yml')).toContain('postgres-test')
      expect(tree.exists('apps/demo/libs/backend/tests/infrastructure/arranger/typeorm-environment-arranger.ts')).toBe(
        true
      )
      expect(read(tree, 'libs/backend/tests/infrastructure/jest.setup.integration.ts')).toContain('runMigrations')
    })
  })

  describe('mongo', () => {
    it('levanta Mongo con replica set (las transacciones lo exigen) y healthcheck', async () => {
      const tree = await emit('mongo')

      const local = read(tree, 'docker/docker-compose.local.yml')
      expect(local).toContain('mongo:7')
      expect(local).toContain('replSet')
      expect(local).toContain('healthcheck')
      expect(local).not.toContain('postgres')

      const test = read(tree, 'docker/docker-compose.test.yml')
      expect(test).toContain('mongo:7')
      expect(test).not.toContain('postgres')
    })

    it('arranca la integración con Mongoose y sin nada de TypeORM', async () => {
      const tree = await emit('mongo')

      expect(tree.exists('apps/demo/libs/backend/tests/infrastructure/arranger/mongoose-environment-arranger.ts')).toBe(
        true
      )
      expect(tree.exists('apps/demo/libs/backend/tests/infrastructure/arranger/typeorm-environment-arranger.ts')).toBe(
        false
      )

      const setup = read(tree, 'libs/backend/tests/infrastructure/jest.setup.integration.ts')
      expect(setup).not.toContain('TypeOrm')
      expect(setup).not.toContain('runMigrations')
      // sin índices materializados los tests de unicidad no verían las restricciones
      expect(setup).toContain('syncIndexes')
    })

    it('no deja ni un rastro de TypeORM en el árbol emitido', async () => {
      const tree = await emit('mongo')

      // Se mira el CÓDIGO, no la prosa: rutas de import y identificadores. Buscar solo
      // 'TypeOrm' dejaba escapar '…/persistence/typeorm/shared-persistence.module', que es
      // justo por donde una app mongo dejaba de compilar.
      const offenders = tree
        .listChanges()
        .filter(change => {
          const content = change.content?.toString('utf-8') ?? ''
          return /from '[^']*typeorm[^']*'/i.test(content) || /\bTypeOrm[A-Z]/.test(content)
        })
        .map(change => change.path)

      expect(offenders).toEqual([])
    })
  })
})
