import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { sharedDomainGenerator } from '../shared-domain/shared-domain'
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

  it('project expone GET /:id/history con su use case fino sobre el puerto', async () => {
    const tree = await emit('project')

    const useCase = read(tree, 'out/backend/application/use-cases/get-project-history-usecase.service.ts')
    expect(useCase).toContain('export class GetProjectHistoryUseCase')
    expect(useCase).toContain("this.auditTrail.of('project', input.id, 50)")
    expect(read(tree, 'out/backend/application/handlers/get-project-history.handler.ts')).toContain(
      'export class GetProjectHistoryHandler'
    )

    const controller = read(tree, 'out/backend/infrastructure/entrypoints/projects.controller.ts')
    expect(controller).toContain("@Get(':id/history')")

    const module = read(tree, 'out/backend/projects.module.ts')
    expect(module).toContain('GetProjectHistoryHandler')
    expect(module).toContain('GetProjectHistoryUseCase')

    expect(read(tree, 'out/backend-tests-application/get-project-history-usecase.test.ts')).toContain(
      'GetProjectHistoryUseCase'
    )
  })

  it('customer no emite nada del endpoint de historial', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/backend/application/use-cases/get-customer-history-usecase.service.ts')).toBe(false)
    expect(read(tree, 'out/backend/infrastructure/entrypoints/customers.controller.ts')).not.toContain('history')
  })

  it('el shared-domain emite el AuditEventDto cuando algún modelo lleva history', async () => {
    const withHistory: Tree = createTreeWithEmptyWorkspace()
    await sharedDomainGenerator(withHistory, { models: 'project', directory: 'out' })
    expect(withHistory.read('out/audit/audit-event.dto.ts', 'utf-8')).toContain('export interface AuditEventDto')
    expect(withHistory.read('out/index.ts', 'utf-8')).toContain("export * from './audit/audit-event.dto'")

    const without: Tree = createTreeWithEmptyWorkspace()
    await sharedDomainGenerator(without, { models: 'customer', directory: 'out' })
    expect(without.exists('out/audit/audit-event.dto.ts')).toBe(false)
  })

  it('el servicio de project lee el historial; el de customer no', async () => {
    const project = await emit('project')
    const customer = await emit('customer')

    const service = read(project, 'out/frontend/project.service.ts')
    expect(service).toContain('history(id: string): Promise<AuditEventDto[]>')
    expect(service).toContain('`${API_URL}/${id}/history`')
    expect(read(customer, 'out/frontend/customer.service.ts')).not.toContain('history')
  })

  it('la ficha de project pinta la timeline del historial', async () => {
    const tree = await emit('project')

    const detail = read(tree, 'out/frontend/project-detail.component.ts')
    expect(detail).toContain('Historial')
    expect(detail).toContain('this._service.history(')
    expect(detail).toContain('actionLabel')
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
