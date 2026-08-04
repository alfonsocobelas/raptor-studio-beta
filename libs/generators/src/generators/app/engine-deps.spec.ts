import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * TASK-10 (spec 06): las dependencias del motor y sus migraciones dejan de venir del
 * esqueleto copiado verbatim. Una app mongo llevaba `typeorm` y `pg` en el package.json,
 * scripts de migración TypeORM y ningún driver de Mongo: no había forma de que arrancase.
 */
describe('app generator — dependencias y migraciones por motor', () => {
  const pkgOf = async (database?: 'postgres' | 'mongo'): Promise<Record<string, Record<string, string>>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'customer', skipInstall: true, database })
    return JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}')
  }

  describe('postgres', () => {
    it('lleva el driver y el ORM de Postgres', async () => {
      const pkg = await pkgOf('postgres')

      expect(pkg.dependencies['typeorm']).toBeDefined()
      expect(pkg.dependencies['pg']).toBeDefined()
      expect(pkg.dependencies['@nestjs/typeorm']).toBeDefined()
      expect(pkg.dependencies['mongoose']).toBeUndefined()
    })

    it('conserva los scripts de migración (las migraciones vienen de fábrica)', async () => {
      const pkg = await pkgOf('postgres')

      expect(pkg.scripts['migration:run']).toBeDefined()
    })
  })

  describe('mongo', () => {
    it('lleva mongoose y NO el stack de Postgres', async () => {
      const pkg = await pkgOf('mongo')

      expect(pkg.dependencies['mongoose']).toBeDefined()
      expect(pkg.dependencies['@nestjs/mongoose']).toBeDefined()
      expect(pkg.dependencies['typeorm']).toBeUndefined()
      expect(pkg.dependencies['pg']).toBeUndefined()
      expect(pkg.dependencies['@nestjs/typeorm']).toBeUndefined()
    })

    it('no trae scripts ni targets de migración: en Mongo los índices se sincronizan', async () => {
      const tree: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, { name: 'demo', models: 'customer', skipInstall: true, database: 'mongo' })

      const pkg = JSON.parse(tree.read('apps/demo/package.json', 'utf-8') ?? '{}')
      expect(Object.keys(pkg.scripts).filter(script => script.startsWith('migration:'))).toEqual([])

      const makefile = tree.read('apps/demo/Makefile', 'utf-8') ?? ''
      expect(makefile).not.toContain('migration:run')

      // y no se emite ninguna migración TypeORM
      const migrations = tree.listChanges().filter(change => change.path.includes('/migrations/'))
      expect(migrations).toEqual([])
    })

    it('sincroniza los índices al arrancar la app, no solo en los tests', async () => {
      const tree: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, { name: 'demo', models: 'customer', skipInstall: true, database: 'mongo' })

      const module =
        tree.read(
          'apps/demo/libs/backend/src/contexts/shared/infrastructure/persistence/mongoose/shared-persistence.module.ts',
          'utf-8'
        ) ?? ''
      expect(module).toContain('syncIndexes')
    })
  })
})
