import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { registerModels, MODELS } from './models/registry'
import { resourceGenerator } from './resource'

/**
 * Spec 38 · TASK-05: el corazón de la spec. El use case de borrado de un padre marca su
 * árbol entero DENTRO de una transacción: el agregado, sus hijos vivos y los hijos de
 * estos, nivel a nivel con la misma operación. Nada de esto vive en la base de datos:
 * quien conoce las relaciones es el dominio.
 */
describe('resource generator — borrado transaccional del árbol (spec 38 TASK-05)', () => {
  const emit = async (name: string): Promise<Tree> => {
    registerModels([MODELS['account'], MODELS['installation'], MODELS['worklog'], MODELS['material']])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('el use case del padre inyecta los repos del árbol y el TransactionManager', async () => {
    const useCase = read(await emit('account'), 'out/backend/application/use-cases/remove-account-usecase.service.ts')

    expect(useCase).toContain(
      "import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'"
    )
    expect(useCase).toContain(
      "import { InstallationRepository } from '../../../installations/domain/installation-repository'"
    )
    expect(useCase).toContain("import { WorklogRepository } from '../../../worklogs/domain/worklog-repository'")
    expect(useCase).toContain('private readonly installationRepository: InstallationRepository')
    expect(useCase).toContain('private readonly txManager: TransactionManager')
  })

  it('marca el árbol nivel a nivel con la misma operación, dentro de la transacción', async () => {
    const useCase = read(await emit('account'), 'out/backend/application/use-cases/remove-account-usecase.service.ts')

    expect(useCase).toContain('await this.txManager.runInTransaction(async () => {')
    expect(useCase).toContain('await this.accountRepository.remove(accountId, op)')
    expect(useCase).toContain(
      'const installationIds = await this.installationRepository.removeDraggedByAccountId([accountId.value], op)'
    )
    expect(useCase).toContain('await this.worklogRepository.removeDraggedByInstallationId(installationIds, op)')
  })

  it('una hoja no abre transacción: su remove es una sola sentencia', async () => {
    const useCase = read(await emit('worklog'), 'out/backend/application/use-cases/remove-worklog-usecase.service.ts')

    expect(useCase).not.toContain('runInTransaction')
    expect(useCase).not.toContain('TransactionManager')
    expect(useCase).toContain('.remove(worklogId, op)')
  })

  it('el módulo del padre importa los módulos de su árbol (la DI cruza módulos)', async () => {
    const module = read(await emit('account'), 'out/backend/accounts.module.ts')

    expect(module).toContain("import { InstallationsModule } from '../installations/installations.module'")
    expect(module).toContain("import { WorklogsModule } from '../worklogs/worklogs.module'")
    expect(module).toMatch(
      /imports: \[[^\]]*forwardRef\(\(\) => InstallationsModule\), forwardRef\(\(\) => WorklogsModule\)/
    )
  })

  it('el test unitario emitido del padre construye el use case con sus colaboradores', async () => {
    const test = read(await emit('account'), 'out/backend-tests-application/remove-account-usecase.test.ts')

    expect(test).toContain('runInTransaction')
    expect(test).toContain('removeDraggedByAccountId')
  })
})
