import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { ResourceDefinition } from '@raptor/schema'
import { shellSubstitutions } from '../app/app'
import { composeFlat } from '../app/composition'
import { resourceGenerator } from './resource'

/**
 * Spec 29 (fase 5 · A1): la papelera se DERIVA de flags existentes — se emite solo
 * cuando el modelo declara `softDelete` Y su listado tiene borrado (`features.delete`).
 * Matriz de los modelos de oro: project (ambos) SÍ · license (softDelete sin delete)
 * NO · customer (ninguno) NO.
 */
describe('resource generator — papelera (spec 29)', () => {
  const emit = async (name: string, database?: 'postgres' | 'mongo'): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out', database })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('project (softDelete + delete) no declara métodos de papelera en el port', async () => {
    const tree = await emit('project')

    const port = read(tree, 'out/backend/domain/project-repository.ts')
    expect(port).not.toContain('matchingDeleted')
    expect(port).not.toContain('countDeleted')
    expect(port).not.toContain('restore')
  })

  it('el repositorio TypeORM de project no implementa papelera', async () => {
    const tree = await emit('project')

    const repo = read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-project.repository.ts')
    expect(repo).not.toContain('Deleted(')
    expect(repo).not.toContain('restore')
  })

  it('el repositorio Mongoose de project no implementa papelera', async () => {
    const tree = await emit('project', 'mongo')

    const repo = read(tree, 'out/backend/infrastructure/persistence/mongoose/mongoose-project.repository.ts')
    expect(repo).not.toContain('Deleted(')
    expect(repo).not.toContain('restore')
  })

  it('el repositorio TypeORM de customer (sin papelera) no cambia', async () => {
    const tree = await emit('customer')

    const repo = read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-customer.repository.ts')
    expect(repo).not.toContain('Deleted')
    expect(repo).not.toContain('restore')
  })

  it('project no emite ningún fichero de restore ni de search de borrados', async () => {
    const tree = await emit('project')

    expect(tree.exists('out/backend/application/use-cases/restore-project-usecase.service.ts')).toBe(false)
    expect(tree.exists('out/backend/application/dtos/restore-project-input.dto.ts')).toBe(false)
    expect(tree.exists('out/backend/application/handlers/restore-project.handler.ts')).toBe(false)
    expect(tree.exists('out/backend/application/use-cases/search-deleted-projects-usecase.service.ts')).toBe(false)
    expect(tree.exists('out/backend/application/handlers/search-deleted-projects.handler.ts')).toBe(false)
  })

  it('el controller de project no expone GET /deleted ni POST /:id/restore', async () => {
    const tree = await emit('project')

    const controller = read(tree, 'out/backend/infrastructure/entrypoints/projects.controller.ts')
    expect(controller).not.toContain("@Get('deleted')")
    expect(controller).not.toContain("@Post(':id/restore')")
    expect(controller).not.toContain('searchDeleted')
  })

  it('el module de project no registra handlers ni use cases de papelera', async () => {
    const tree = await emit('project')

    const module = read(tree, 'out/backend/projects.module.ts')
    expect(module).not.toContain('SearchDeleted')
    expect(module).not.toContain('Restore')
  })

  it('el controller y el module de customer no saben nada de la papelera', async () => {
    const tree = await emit('customer')

    expect(read(tree, 'out/backend/infrastructure/entrypoints/customers.controller.ts')).not.toContain('deleted')
    expect(read(tree, 'out/backend/customers.module.ts')).not.toContain('Restore')
  })

  it('license (softDelete SIN delete en la lista) no lleva papelera', async () => {
    const tree = await emit('license')

    const port = read(tree, 'out/backend/domain/license-repository.ts')
    expect(port).not.toContain('matchingDeleted')
    expect(port).not.toContain('restore(')
  })

  it('customer (sin softDelete) queda exactamente igual que antes', async () => {
    const tree = await emit('customer')

    const port = read(tree, 'out/backend/domain/customer-repository.ts')
    expect(port).not.toContain('Deleted')
    expect(port).not.toContain('restore(')
  })
})

describe('resource generator — tests emitidos de la papelera (spec 29 TASK-07)', () => {
  const emit = async (name: string, database?: 'postgres' | 'mongo'): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out', database })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('el mock del repositorio de project no crece con métodos de papelera', async () => {
    const tree = await emit('project')

    const mock = read(tree, 'out/backend-tests/project.repository.mock.ts')
    expect(mock).not.toContain('matchingDeleted')
    expect(mock).not.toContain('countDeleted')
    expect(mock).not.toContain('givenDeleted')
    expect(mock).not.toContain('Restore')
  })

  it('el mock de customer no crece', async () => {
    const tree = await emit('customer')

    expect(read(tree, 'out/backend-tests/customer.repository.mock.ts')).not.toContain('Deleted')
  })

  it('no emite tests de restore ni de search de borrados', async () => {
    const tree = await emit('project')

    expect(tree.exists('out/backend-tests-application/restore-project-usecase.test.ts')).toBe(false)
    expect(tree.exists('out/backend-tests-application/search-deleted-projects-usecase.test.ts')).toBe(false)
  })

  it('las integraciones de project no ejercitan papelera', async () => {
    const typeorm = await emit('project')
    const mongo = await emit('project', 'mongo')

    expect(read(typeorm, 'out/backend-tests-integration/typeorm-project.repository.test.ts')).not.toContain('Deleted')
    expect(read(mongo, 'out/backend-tests-integration/mongoose-project.repository.test.ts')).not.toContain('Deleted')
  })

  it('el servicio frontend de project no sabe de la papelera', async () => {
    const tree = await emit('project')

    const service = read(tree, 'out/frontend/project.service.ts')
    expect(service).not.toContain('trashRequest')
    expect(service).not.toContain('/deleted')
    expect(service).not.toContain('restore')
  })

  it('el servicio de customer no sabe de la papelera', async () => {
    const tree = await emit('customer')

    expect(read(tree, 'out/frontend/customer.service.ts')).not.toContain('deleted')
  })

  it('las integraciones de customer no cambian', async () => {
    const typeorm = await emit('customer')
    const mongo = await emit('customer', 'mongo')

    expect(read(typeorm, 'out/backend-tests-integration/typeorm-customer.repository.test.ts')).not.toContain('Deleted')
    expect(read(mongo, 'out/backend-tests-integration/mongoose-customer.repository.test.ts')).not.toContain('Deleted')
  })

  it('ningún recurso emite componente de papelera', async () => {
    const project = await emit('project')
    const customer = await emit('customer')

    expect(project.exists('out/frontend/projects-trash.component.ts')).toBe(false)
    expect(customer.exists('out/frontend/customers-trash.component.ts')).toBe(false)
  })

  it('ningún listado enlaza a la papelera', async () => {
    const project = await emit('project')
    const customer = await emit('customer')

    expect(read(project, 'out/frontend/projects-list.component.ts')).not.toContain('Papelera')
    expect(read(customer, 'out/frontend/customers-list.component.ts')).not.toContain('Papelera')
  })

})

describe('shellSubstitutions — sin ruta de papelera (spec 29 retirada)', () => {
  const model = (extra: object = {}): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name: 'project',
      plural: 'projects',
      context: 'crm',
      schemaName: 'crm',
      fields: { id: { type: 'uuid', pk: true } },
      ...extra
    }) as ResourceDefinition

  it('un listado que borra y archiva no registra ruta de papelera', () => {
    const subs = shellSubstitutions(
      composeFlat([model({ softDelete: true, list: { features: { delete: true } } })], false)
    )

    expect(subs.routeEntries).not.toContain('papelera')
    expect(subs.routeEntries).not.toContain('TrashComponent')
  })

  it('con la escotilla física (softDelete: false) tampoco', () => {
    const subs = shellSubstitutions(
      composeFlat([model({ softDelete: false, list: { features: { delete: true } } })], false)
    )

    expect(subs.routeEntries).not.toContain('papelera')
  })
})
