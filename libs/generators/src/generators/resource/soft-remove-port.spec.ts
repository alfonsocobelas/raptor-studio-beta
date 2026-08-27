import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { registerModels, MODELS } from './models/registry'
import { resourceGenerator } from './resource'

/**
 * Spec 38 · TASK-04: el contrato de borrado del repositorio. `remove` viaja con la
 * operación que lo causa, cada hijo arrastrable sabe marcarse desde su padre
 * (`removeDraggedBy<Fk>`) y `restoreByOp` revierte una operación entera. El adapter
 * TypeORM lo implementa con updates que se unen a la transacción ambiental — nunca
 * un trigger, nunca cascada.
 */
describe('resource generator — contrato de borrado suave (spec 38 TASK-04)', () => {
  const emit = async (name: string): Promise<Tree> => {
    registerModels([MODELS['account'], MODELS['installation'], MODELS['worklog'], MODELS['material']])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('el remove suave viaja con su operación', async () => {
    const tree = await emit('account')

    const port = read(tree, 'out/backend/domain/account-repository.ts')
    expect(port).toContain('abstract remove(accountId: AccountId, op: DeleteOperationId): Promise<void>')
    const repo = read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-account.repository.ts')
    expect(repo).toContain('async remove(accountId: AccountId, op: DeleteOperationId): Promise<void>')
    // el update marca deletedAt y deletedOp de una vez, solo sobre filas vivas
    expect(repo).toMatch(/deletedOp: op\.value/)
  })

  it('un hijo arrastrable sabe marcarse desde su padre y devuelve los ids marcados', async () => {
    const tree = await emit('installation')

    const port = read(tree, 'out/backend/domain/installation-repository.ts')
    expect(port).toContain(
      'abstract removeDraggedByAccountId(parentIds: string[], op: DeleteOperationId): Promise<string[]>'
    )
    const repo = read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-installation.repository.ts')
    expect(repo).toContain('async removeDraggedByAccountId(parentIds: string[], op: DeleteOperationId)')
    // guard: sin padres no hay consulta (In([]) sería SQL inválido)
    expect(repo).toContain('if (!parentIds.length) return []')
  })

  it('la entidad física conserva el contrato de siempre', async () => {
    const tree = await emit('material')

    const port = read(tree, 'out/backend/domain/material-repository.ts')
    expect(port).toContain('abstract remove(materialId: MaterialId): Promise<void>')
    expect(port).not.toContain('DeleteOperationId')
  })

  it('el use case genera la operación y la pasa al remove', async () => {
    const tree = await emit('account')

    const useCase = read(tree, 'out/backend/application/use-cases/remove-account-usecase.service.ts')
    expect(useCase).toContain('const op = DeleteOperationId.random()')
    expect(useCase).toContain('.remove(accountId, op)')
  })

  it('el mock emitido implementa el contrato nuevo (los tests emitidos deben compilar)', async () => {
    const tree = await emit('installation')

    const mock = read(tree, 'out/backend-tests/installation.repository.mock.ts')
    expect(mock).toContain('remove(installationId: InstallationId, op: DeleteOperationId): Promise<void>')
    expect(mock).toContain('removeDraggedByAccountId(')
  })
})
