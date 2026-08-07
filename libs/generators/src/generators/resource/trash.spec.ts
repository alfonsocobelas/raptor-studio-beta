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
    expect(port).toContain('abstract restore(projectId: ProjectId): Promise<void>')
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
