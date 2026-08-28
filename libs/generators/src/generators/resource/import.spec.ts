import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * El import CSV (spec 33) se RETIRÓ: `list.features.import` ya no emite nada — ni endpoint,
 * ni caso de uso, ni diálogo, ni botón. Estos tests son el guard de que no reaparece.
 */
describe('resource generator — sin import CSV (spec 33 retirada)', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('project (con features.import) no emite el use case ni el handler de import', async () => {
    const tree = await emit('project')

    expect(tree.exists('out/backend/application/use-cases/import-projects-usecase.service.ts')).toBe(false)
    expect(tree.exists('out/backend/application/handlers/import-projects.handler.ts')).toBe(false)
    expect(tree.exists('out/backend/application/dtos/import-projects-input.dto.ts')).toBe(false)
    expect(tree.exists('out/backend/infrastructure/entrypoints/dtos/import-projects.dto.ts')).toBe(false)
  })

  it('el controller no expone POST /import y el module no registra nada de import', async () => {
    const tree = await emit('project')

    expect(read(tree, 'out/backend/infrastructure/entrypoints/projects.controller.ts')).not.toContain("@Post('import')")

    const module = read(tree, 'out/backend/projects.module.ts')
    expect(module).not.toContain('ImportProjects')
  })

  it('no emite el test del use case de import', async () => {
    const tree = await emit('project')

    expect(tree.exists('out/backend-tests-application/import-projects-usecase.test.ts')).toBe(false)
  })

  it('el servicio de project envía las filas y recarga; el diálogo parsea y coacciona tipos', async () => {
    const tree = await emit('project')

    const service = read(tree, 'out/frontend/project.service.ts')
    expect(service).toContain('importRows(rows: RegisterProjectDto[]): Promise<ImportOutput>')
    expect(service).toContain('`${API_URL}/import`')

    const dialog = read(tree, 'out/frontend/projects-import.component.ts')
    expect(dialog).toContain('export class ProjectsImportComponent')
    // el parser vive en el propio diálogo: comillas y comas, sin dependencias
    expect(dialog).toContain('parseCsv')
    // cada columna se coacciona según el tipo del campo del alta
    expect(dialog).toContain("{ name: 'name', kind: 'text' }")
    expect(dialog).toContain("{ name: 'startDate', kind: 'date' }")
    // plantilla descargable con las cabeceras exactas
    expect(dialog).toContain('Descargar plantilla')
    expect(dialog).toContain('generateId()')
  })

  it('el listado de project abre el diálogo de import; el de customer no', async () => {
    const project = await emit('project')
    const customer = await emit('customer')

    const list = read(project, 'out/frontend/projects-list.component.ts')
    expect(list).toContain('ProjectsImportComponent')
    expect(list).toContain('Importar')
    expect(read(customer, 'out/frontend/customers-list.component.ts')).not.toContain('Importar')
    expect(customer.exists('out/frontend/customers-import.component.ts')).toBe(false)
  })

  it('customer (sin import) queda exactamente igual que antes', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/backend/application/use-cases/import-customers-usecase.service.ts')).toBe(false)
    expect(read(tree, 'out/backend/infrastructure/entrypoints/customers.controller.ts')).not.toContain('import(')
    expect(read(tree, 'out/backend/customers.module.ts')).not.toContain('Import')
  })
})
