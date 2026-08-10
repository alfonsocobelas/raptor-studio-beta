import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { ResourceDefinition } from '@acc/schema'
import { MODELS, registerModels } from './models/registry'
import { resourceGenerator } from './resource'

/**
 * Spec 38 · TASK-01: el borrado emitido es SUAVE por defecto. `softDelete` deja de ser
 * opt-in — un modelo que no dice nada archiva (DeleteDateColumn + papelera si borra), y
 * la escotilla física es declarar `softDelete: false` (catálogos puros como `material`).
 * Doctrina: el caso de uso gobierna, cero lógica de negocio en Postgres.
 */
describe('resource generator — borrado suave por defecto (spec 38)', () => {
  const emit = async (model: ResourceDefinition): Promise<Tree> => {
    registerModels([model])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  const base = (): ResourceDefinition =>
    ({
      ...MODELS['supplier'],
      name: 'expediente',
      plural: 'expedientes',
      labels: { singular: 'Expediente', plural: 'Expedientes' },
      list: {
        deleteLabelField: 'name',
        features: { create: true, search: true, view: false, edit: true, delete: true }
      }
    }) as unknown as ResourceDefinition

  it('un modelo que NO declara softDelete archiva: DeleteDateColumn y papelera', async () => {
    const model = base()
    delete (model as { softDelete?: boolean }).softDelete
    const tree = await emit(model)

    expect(read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-expediente.entity.ts')).toContain(
      'DeleteDateColumn'
    )
    const port = read(tree, 'out/backend/domain/expediente-repository.ts')
    expect(port).toContain('matchingDeleted')
    expect(port).toContain('restore(')
  })

  it('softDelete: false es la escotilla física: sin DeleteDateColumn y sin papelera', async () => {
    const tree = await emit({ ...base(), softDelete: false })

    expect(read(tree, 'out/backend/infrastructure/persistence/typeorm/typeorm-expediente.entity.ts')).not.toContain(
      'DeleteDateColumn'
    )
    const port = read(tree, 'out/backend/domain/expediente-repository.ts')
    expect(port).not.toContain('matchingDeleted')
    expect(port).not.toContain('restore(')
  })

  it('material (catálogo puro de la demo) declara la escotilla física', () => {
    expect(MODELS['material'].softDelete).toBe(false)
  })
})
