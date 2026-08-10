import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { registerModels, MODELS } from './models/registry'
import { resourceGenerator } from './resource'

/**
 * Spec 38 · TASK-06: restaurar revierte LA OPERACIÓN, no la fila. El padre averigua con
 * qué operación cayó su fila archivada (deletedOpOf) y revierte el árbol entero en una
 * transacción: vuelve exactamente lo que aquel borrado arrastró (decisión 1). Un hijo
 * borrado por su cuenta lleva otra operación y se queda en la papelera.
 */
describe('resource generator — restauración por operación (spec 38 TASK-06)', () => {
  const emit = async (name: string): Promise<Tree> => {
    registerModels([MODELS['account'], MODELS['installation'], MODELS['worklog'], MODELS['material']])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('el port del padre sabe con qué operación cayó una fila archivada', async () => {
    const tree = await emit('account')

    const port = read(tree, 'out/backend/domain/account-repository.ts')
    expect(port).toContain('abstract deletedOpOf(accountId: AccountId): Promise<Nullable<DeleteOperationId>>')

    const typeorm = read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-account.repository.ts')
    expect(typeorm).toContain('async deletedOpOf(accountId: AccountId)')
    expect(typeorm).toContain('withDeleted: true')
  })

  it('el restore del padre revierte el árbol entero dentro de la transacción', async () => {
    const useCase = read(
      await emit('account'),
      'out/backend/application/use-cases/restore-account-usecase.service.ts'
    )

    expect(useCase).toContain('const op = await this.accountRepository.deletedOpOf(accountId)')
    expect(useCase).toContain('await this.txManager.runInTransaction(async () => {')
    expect(useCase).toContain('await this.accountRepository.restoreByOp(op)')
    expect(useCase).toContain('await this.installationRepository.restoreByOp(op)')
    expect(useCase).toContain('await this.worklogRepository.restoreByOp(op)')
  })

  it('una hoja restaura como siempre: su fila, sin transacción', async () => {
    const useCase = read(
      await emit('worklog'),
      'out/backend/application/use-cases/restore-worklog-usecase.service.ts'
    )

    expect(useCase).toContain('.restore(WorklogId.create(input.id))')
    expect(useCase).not.toContain('runInTransaction')
  })

  it('el mock emitido implementa deletedOpOf (los tests emitidos deben compilar)', async () => {
    const mock = read(await emit('account'), 'out/backend-tests/account.repository.mock.ts')

    expect(mock).toContain('deletedOpOf(')
  })
})
