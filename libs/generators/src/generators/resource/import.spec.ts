import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 33 (fase 5 · B1v): el import valida cada fila con los MISMOS value objects
 * del alta, en dos fases — errores de dominio por fila, o todo dentro de una
 * transacción. `list.features.import` es lo que lo emite.
 */
describe('resource generator — import CSV validado (spec 33)', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('project emite el use case en dos fases sobre el register de siempre', async () => {
    const tree = await emit('project')

    const useCase = read(tree, 'out/backend/application/use-cases/import-projects-usecase.service.ts')
    expect(useCase).toContain('export class ImportProjectsUseCase')
    // fase 1: el dominio revisa TODAS las filas y acumula errores por fila
    expect(useCase).toContain('Project.register(row)')
    expect(useCase).toContain('BusinessRuleViolationError')
    // fase 2: todo o nada, delegando en el register (unicidad y auditoría incluidas)
    expect(useCase).toContain('this.txManager.runInTransaction')
    expect(useCase).toContain('this.registerProject.invoke(row)')
    expect(useCase).toContain('MAX_IMPORT_ROWS')

    expect(read(tree, 'out/backend/application/handlers/import-projects.handler.ts')).toContain(
      'export class ImportProjectsHandler'
    )
  })

  it('el controller expone POST /import y el module registra las piezas', async () => {
    const tree = await emit('project')

    const controller = read(tree, 'out/backend/infrastructure/entrypoints/projects.controller.ts')
    expect(controller).toContain("@Post('import')")

    const module = read(tree, 'out/backend/projects.module.ts')
    expect(module).toContain('ImportProjectsHandler')
    expect(module).toContain('ImportProjectsUseCase')
  })

  it('emite el test del use case: fila mala no importa nada; limpias entran todas', async () => {
    const tree = await emit('project')

    const test = read(tree, 'out/backend-tests-application/import-projects-usecase.test.ts')
    expect(test).toContain('ImportProjectsUseCase')
    expect(test).toContain("assertNotCalled('register')")
  })

  it('customer (sin import) queda exactamente igual que antes', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/backend/application/use-cases/import-customers-usecase.service.ts')).toBe(false)
    expect(read(tree, 'out/backend/infrastructure/entrypoints/customers.controller.ts')).not.toContain('import(')
    expect(read(tree, 'out/backend/customers.module.ts')).not.toContain('Import')
  })
})
