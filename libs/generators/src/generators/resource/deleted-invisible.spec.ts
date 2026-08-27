import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app/app'
import { registerModels, MODELS } from './models/registry'
import { resourceGenerator } from './resource'

/**
 * Spec 38 · TASK-09: lo archivado NO se ve en NINGUNA superficie. La auditoría se escribe
 * como test porque «ya filtra» es exactamente el tipo de afirmación que envejece mal: cada
 * vista nueva (galería, gantt, widgets, tablas relacionadas) hereda el filtrado solo si
 * sigue leyendo por el mismo camino, y esto lo fija.
 */
describe('resource generator — lo archivado no se ve (spec 38 TASK-09)', () => {
  const emit = async (name: string, database?: 'postgres' | 'mongo'): Promise<Tree> => {
    registerModels([MODELS['account'], MODELS['installation'], MODELS['worklog'], MODELS['material']])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out', database })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  describe('backend: toda lectura pasa por el criteria, que excluye lo borrado', () => {
    it('el listado y el export leen por matching/count, nunca por el modelo crudo', async () => {
      const tree = await emit('account')

      const search = read(tree, 'out/backend/application/use-cases/search-accounts-usecase.service.ts')
      expect(search).toContain('this.accountRepository.matching(criteria)')
      expect(search).toContain('this.accountRepository.count(criteria)')

      const exporter = read(tree, 'out/backend/application/use-cases/export-accounts-usecase.service.ts')
      expect(exporter).toContain('this.accountRepository.matching(criteria)')
      expect(exporter).not.toContain('withDeleted')
    })

    it('el repositorio TypeORM no mira nunca lo archivado', async () => {
      const repo = read(
        await emit('account'),
        'out/backend/infrastructure/persistence/typeorm/typeorm-account.repository.ts'
      )

      // matching/count/exists no lo mencionan: heredan la exclusión del repositorio base
      expect(repo).toContain('async matching(criteria: Criteria)')
      expect(repo).toContain('this.searchByCriteria(criteria)')
      // sin papelera ni restauración por operación, nada consulta lo archivado
      expect(repo).not.toContain('withDeleted')
    })

    it('el repositorio Mongoose filtra deletedAt: null en las lecturas vivas', async () => {
      const repo = read(
        await emit('account', 'mongo'),
        'out/backend/infrastructure/persistence/mongoose/mongoose-account.repository.ts'
      )

      expect(repo).toContain('deletedAt: null')
    })

    it('el arrastre solo toca hijos VIVOS: un hijo ya archivado conserva su operación', async () => {
      const repo = read(
        await emit('installation'),
        'out/backend/infrastructure/persistence/typeorm/typeorm-installation.repository.ts'
      )

      expect(repo).toMatch(/removeDraggedByAccountId[\s\S]{0,400}deletedAt: IsNull\(\)/)
    })
  })

  describe('frontend: cada superficie lee del mismo endpoint del listado', () => {
    it('la galería y el cronograma consumen el servicio del recurso, no un endpoint propio', async () => {
      const tree = await emit('installation')

      const gantt = read(tree, 'out/frontend/installations-gantt.component.ts')
      expect(gantt).toContain('InstallationService')
      expect(gantt).not.toContain('/deleted')
    })

    it('la tabla relacionada de la ficha consulta el listado del hijo, filtrado por el padre', async () => {
      const detail = read(await emit('account'), 'out/frontend/account-detail.component.ts')

      expect(detail).toContain('endpoint="/api/v1/installations"')
      expect(detail).not.toContain('/deleted')
    })
  })

  describe('app: los widgets del panel cuentan sobre el mismo listado', () => {
    it('el dashboard pide el total al endpoint paginado del recurso', async () => {
      const tree: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, { name: 'demo', models: 'customer', dashboard: true, skipInstall: true })

      const service = read(tree, 'apps/demo/libs/frontend/src/core/services/dashboard.service.ts')
      expect(service).toContain("pageSize: '1'")
      expect(service).not.toContain('/deleted')
    })
  })
})
