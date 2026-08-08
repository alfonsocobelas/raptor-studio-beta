import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 31 (TASK-03): con `history`, los use cases de escritura registran eventos
 * tras el éxito, vía AuditTrailPort (mejor esfuerzo — la política vive en el adapter).
 */
describe('resource generator — historial en los use cases (spec 31)', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('register/remove/restore de project registran su acción', async () => {
    const tree = await emit('project')

    const register = read(tree, 'out/backend/application/use-cases/register-project-usecase.service.ts')
    expect(register).toContain('private readonly auditTrail: AuditTrailPort')
    expect(register).toContain("action: 'created'")

    expect(read(tree, 'out/backend/application/use-cases/remove-project-usecase.service.ts')).toContain(
      "action: 'deleted'"
    )
    expect(read(tree, 'out/backend/application/use-cases/restore-project-usecase.service.ts')).toContain(
      "action: 'restored'"
    )
  })

  it('el update registra SOLO lo que cambió, con antes y después', async () => {
    const tree = await emit('project')

    const update = read(tree, 'out/backend/application/use-cases/update-project-usecase.service.ts')
    expect(update).toContain('const before = project.toPrimitives()')
    expect(update).toContain('changesBetween(before, project.toPrimitives())')
    expect(update).toContain("action: 'updated'")
  })

  it('el module de project importa el AuditModule global', async () => {
    const tree = await emit('project')

    expect(read(tree, 'out/backend/projects.module.ts')).toContain('AuditModule')
  })

  it('los tests emitidos de project construyen los use cases con el mock del puerto', async () => {
    const tree = await emit('project')

    const test = read(tree, 'out/backend-tests-application/register-project-usecase.test.ts')
    expect(test).toContain('auditTrail')
    expect(test).toContain('new RegisterProjectUseCase(repositoryMock, auditTrail)')
  })

  it('customer (sin history) queda exactamente igual que antes', async () => {
    const tree = await emit('customer')

    expect(read(tree, 'out/backend/application/use-cases/register-customer-usecase.service.ts')).not.toContain(
      'auditTrail'
    )
    expect(read(tree, 'out/backend/customers.module.ts')).not.toContain('AuditModule')
    expect(read(tree, 'out/backend-tests-application/register-customer-usecase.test.ts')).not.toContain('auditTrail')
  })
})
