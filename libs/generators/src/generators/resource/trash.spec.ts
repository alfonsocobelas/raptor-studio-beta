import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
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
