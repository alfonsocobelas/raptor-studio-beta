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

  it('project (softDelete + delete) declara los métodos de papelera en el port', async () => {
    const tree = await emit('project')

    const port = read(tree, 'out/backend/domain/project-repository.ts')
    expect(port).toContain('abstract matchingDeleted(criteria: Criteria): Promise<Project[]>')
    expect(port).toContain('abstract countDeleted(criteria: Criteria): Promise<number>')
    expect(port).toContain('abstract restore(projectId: ProjectId): Promise<boolean>')
  })

  it('el repositorio TypeORM de project implementa la papelera sobre el criteria del kernel', async () => {
    const tree = await emit('project')

    const repo = read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-project.repository.ts')
    expect(repo).toContain('async matchingDeleted(criteria: Criteria): Promise<Project[]>')
    expect(repo).toContain('this.searchDeletedByCriteria(criteria)')
    expect(repo).toContain('async countDeleted(criteria: Criteria): Promise<number>')
    expect(repo).toContain('this.countDeletedByCriteria(criteria)')
    expect(repo).toContain('async restore(projectId: ProjectId): Promise<boolean>')
    // solo se restaura lo que está borrado: restaurar un vivo (o un id inexistente) devuelve false
    expect(repo).toContain('.restore({ id: projectId.value, deletedAt: Not(IsNull()) })')
  })

  it('el repositorio TypeORM de customer (sin papelera) no cambia', async () => {
    const tree = await emit('customer')

    const repo = read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-customer.repository.ts')
    expect(repo).not.toContain('Deleted')
    expect(repo).not.toContain('restore')
  })

  it('el repositorio Mongoose de project implementa la papelera (borrados $ne null y restore)', async () => {
    const tree = await emit('project', 'mongo')

    const repo = read(tree, 'out/backend/infrastructure/persistence/mongoose/mongoose-project.repository.ts')
    expect(repo).toContain('async matchingDeleted(criteria: Criteria): Promise<Project[]>')
    expect(repo).toContain('this.searchDeletedByCriteria(criteria)')
    expect(repo).toContain('async countDeleted(criteria: Criteria): Promise<number>')
    expect(repo).toContain('this.countDeletedByCriteria(criteria)')
    expect(repo).toContain('async restore(projectId: ProjectId): Promise<boolean>')
    expect(repo).toContain('{ id: projectId.value, deletedAt: { $ne: null } }')
    expect(repo).toContain('{ $set: { deletedAt: null } }')
  })

  it('project emite el use case de restore con su 404, el input y el handler', async () => {
    const tree = await emit('project')

    const useCase = read(tree, 'out/backend/application/use-cases/restore-project-usecase.service.ts')
    expect(useCase).toContain('export class RestoreProjectUseCase')
    expect(useCase).toContain('const restored = await this.projectRepository.restore(ProjectId.create(input.id))')
    expect(useCase).toContain("throw new EntityNotFoundError('Project', input.id)")
    expect(read(tree, 'out/backend/application/dtos/restore-project-input.dto.ts')).toContain(
      'export interface RestoreProjectInput'
    )
    expect(read(tree, 'out/backend/application/handlers/restore-project.handler.ts')).toContain(
      'export class RestoreProjectHandler'
    )
  })

  it('customer no emite ningún fichero de restore', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/backend/application/use-cases/restore-customer-usecase.service.ts')).toBe(false)
    expect(tree.exists('out/backend/application/dtos/restore-customer-input.dto.ts')).toBe(false)
    expect(tree.exists('out/backend/application/handlers/restore-customer.handler.ts')).toBe(false)
  })

  it('project emite el search de borrados como espejo del search (mismo config y paginación)', async () => {
    const tree = await emit('project')

    const useCase = read(tree, 'out/backend/application/use-cases/search-deleted-projects-usecase.service.ts')
    expect(useCase).toContain('export class SearchDeletedProjectsUseCase')
    expect(useCase).toContain('searchProjectConfig')
    expect(useCase).toContain('this.projectRepository.matchingDeleted(criteria)')
    expect(useCase).toContain('this.projectRepository.countDeleted(criteria)')
    expect(read(tree, 'out/backend/application/handlers/search-deleted-projects.handler.ts')).toContain(
      'export class SearchDeletedProjectsHandler'
    )
  })

  it('el controller de project expone GET /deleted ANTES de :id y POST /:id/restore', async () => {
    const tree = await emit('project')

    const controller = read(tree, 'out/backend/infrastructure/entrypoints/projects.controller.ts')
    expect(controller).toContain("@Get('deleted')")
    expect(controller).toContain("@Post(':id/restore')")
    expect(controller).toContain('searchDeleted(')
    expect(controller).toContain('restore(')
    // el orden de declaración ES el orden de matching en Nest: 'deleted' no puede caer en ':id'
    expect(controller.indexOf("@Get('deleted')")).toBeLessThan(controller.indexOf("@Get(':id')"))
  })

  it('el module de project registra el handler y el use case de la papelera', async () => {
    const tree = await emit('project')

    const module = read(tree, 'out/backend/projects.module.ts')
    expect(module).toContain('SearchDeletedProjectsHandler')
    expect(module).toContain('SearchDeletedProjectsUseCase')
    expect(module).toContain('RestoreProjectHandler')
    expect(module).toContain('RestoreProjectUseCase')
  })

  it('el controller y el module de customer no saben nada de la papelera', async () => {
    const tree = await emit('customer')

    expect(read(tree, 'out/backend/infrastructure/entrypoints/customers.controller.ts')).not.toContain('deleted')
    expect(read(tree, 'out/backend/customers.module.ts')).not.toContain('Restore')
  })

  it('customer no emite el search de borrados', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/backend/application/use-cases/search-deleted-customers-usecase.service.ts')).toBe(false)
    expect(tree.exists('out/backend/application/handlers/search-deleted-customers.handler.ts')).toBe(false)
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

  it('el mock del repositorio de project implementa y ayuda con los métodos de papelera', async () => {
    const tree = await emit('project')

    const mock = read(tree, 'out/backend-tests/project.repository.mock.ts')
    expect(mock).toContain("this.getMock('matchingDeleted')(criteria)")
    expect(mock).toContain("this.getMock('countDeleted')(criteria)")
    expect(mock).toContain("this.getMock('restore')(projectId)")
    expect(mock).toContain('givenDeleted(')
    expect(mock).toContain('givenDeletedCount(')
    expect(mock).toContain('whenRestoreSucceeds(')
    expect(mock).toContain('whenRestoreFindsNothing(')
  })

  it('el mock de customer no crece', async () => {
    const tree = await emit('customer')

    expect(read(tree, 'out/backend-tests/customer.repository.mock.ts')).not.toContain('Deleted')
  })

  it('emite el test del restore con su rama de 404', async () => {
    const tree = await emit('project')

    const test = read(tree, 'out/backend-tests-application/restore-project-usecase.test.ts')
    expect(test).toContain('RestoreProjectUseCase')
    expect(test).toContain('whenRestoreSucceeds')
    expect(test).toContain('EntityNotFoundError')
  })

  it('emite el test del search de borrados', async () => {
    const tree = await emit('project')

    const test = read(tree, 'out/backend-tests-application/search-deleted-projects-usecase.test.ts')
    expect(test).toContain('SearchDeletedProjectsUseCase')
    expect(test).toContain('givenDeleted(')
  })

  it('customer no emite tests de papelera', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/backend-tests-application/restore-customer-usecase.test.ts')).toBe(false)
    expect(tree.exists('out/backend-tests-application/search-deleted-customers-usecase.test.ts')).toBe(false)
  })

  it('la integración TypeORM de project ejercita borrar → papelera → restaurar', async () => {
    const tree = await emit('project')

    const test = read(tree, 'out/backend-tests-integration/typeorm-project.repository.test.ts')
    expect(test).toContain('matchingDeleted')
    expect(test).toContain('countDeleted')
    expect(test).toContain('repository.restore(')
  })

  it('la integración Mongoose de project ejercita borrar → papelera → restaurar', async () => {
    const tree = await emit('project', 'mongo')

    const test = read(tree, 'out/backend-tests-integration/mongoose-project.repository.test.ts')
    expect(test).toContain('matchingDeleted')
    expect(test).toContain('repository.restore(')
  })

  it('el servicio frontend de project consulta /deleted y restaura recargando ambos', async () => {
    const tree = await emit('project')

    const service = read(tree, 'out/frontend/project.service.ts')
    expect(service).toContain('trashRequest')
    expect(service).toContain('`${API_URL}/deleted`')
    expect(service).toContain('restore(id: string): Promise<void>')
    expect(service).toContain('`${API_URL}/${id}/restore`')
    expect(service).toContain('this.deleted.reload()')
  })

  it('el servicio de customer no sabe de la papelera', async () => {
    const tree = await emit('customer')

    expect(read(tree, 'out/frontend/customer.service.ts')).not.toContain('deleted')
  })

  it('las integraciones de customer no cambian', async () => {
    const typeorm = await emit('customer')
    const mongo = await emit('customer', 'mongo')

    expect(read(typeorm, 'out/backend-tests-integration/typeorm-customer.repository.test.ts')).not.toContain(
      'Deleted'
    )
    expect(read(mongo, 'out/backend-tests-integration/mongoose-customer.repository.test.ts')).not.toContain('Deleted')
  })

  it('project emite el componente de papelera con la acción de restaurar', async () => {
    const tree = await emit('project')

    const component = read(tree, 'out/frontend/projects-trash.component.ts')
    expect(component).toContain('export class ProjectsTrashComponent')
    expect(component).toContain('this._service.deleted')
    expect(component).toContain("action: 'restore'")
    expect(component).toContain('lucideArchiveRestore')
    expect(component).toContain('this._service.restore(')
  })

  it('customer no emite componente de papelera', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/frontend/customers-trash.component.ts')).toBe(false)
  })

  it('el listado de project enlaza a la papelera; el de customer no', async () => {
    const project = await emit('project')
    const customer = await emit('customer')

    const list = read(project, 'out/frontend/projects-list.component.ts')
    expect(list).toContain('>Papelera<')
    expect(list).toContain('routerLink')
    expect(read(customer, 'out/frontend/customers-list.component.ts')).not.toContain('Papelera')
  })
})

describe('shellSubstitutions — ruta de la papelera (spec 29)', () => {
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

  const trashy = { softDelete: true, list: { features: { delete: true } } }

  it('registra <ruta>/papelera sin entrada de menú', () => {
    const subs = shellSubstitutions(composeFlat([model(trashy)], false))

    expect(subs.routeEntries).toContain("path: 'crm/projects/papelera'")
    expect(subs.routeEntries).toContain('ProjectsTrashComponent')
    expect(subs.navItems).not.toContain('papelera')
  })

  it('la papelera va ANTES de :id, o la ficha capturaría «papelera» como id', () => {
    const subs = shellSubstitutions(composeFlat([model({ ...trashy, detail: {} })], false))

    expect(subs.routeEntries.indexOf('projects/papelera')).toBeLessThan(subs.routeEntries.indexOf('projects/:id'))
  })

  // spec 38: el borrado es suave por defecto, así que un listado que borra YA lleva papelera;
  // quien no la quiere declara la escotilla física
  it('un listado que borra lleva papelera aunque no declare nada', () => {
    const subs = shellSubstitutions(composeFlat([model({ list: { features: { delete: true } } })], false))

    expect(subs.routeEntries).toContain('papelera')
  })

  it('con la escotilla física (softDelete: false) no hay ruta de papelera', () => {
    const subs = shellSubstitutions(
      composeFlat([model({ softDelete: false, list: { features: { delete: true } } })], false)
    )

    expect(subs.routeEntries).not.toContain('papelera')
  })
})
