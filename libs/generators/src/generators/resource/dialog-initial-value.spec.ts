import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'

/**
 * Spec 64: el diálogo CRUD acepta un valor inicial opcional para el alta —
 * quien lo abre (el calendario, mañana otro bloque) pre-rellena campos sin
 * tocar el formulario ni duplicar lógica.
 */
describe('resource generator — initialValue del diálogo', () => {
  const generate = async (): Promise<Tree> => {
    const model = MODELS['supplier']
    registerModels([model])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree
  }

  const dialogOf = async (): Promise<string> => {
    const tree = await generate()
    return tree.read('out/frontend/supplier-dialog.component.ts', 'utf-8') ?? ''
  }

  it('expone el input opcional initialValue tipado con el FormValue', async () => {
    const dialog = await dialogOf()

    expect(dialog).toContain('readonly initialValue = input<Partial<SupplierFormValue> | null>(null)')
  })

  it('sin entidad, el effect precarga el formulario con initialValue', async () => {
    const dialog = await dialogOf()

    expect(dialog).toMatch(/const initial = this\.initialValue\(\)\s*\n\s*if \(initial\) \{\s*\n\s*this\.form\.patchValue\(initial\)/)
  })

  it('con entidad manda la entidad: el patch de edición corta antes del initialValue', async () => {
    const dialog = await dialogOf()

    const editPatch = dialog.indexOf('if (supplier) {')
    const guard = dialog.indexOf('return', editPatch)
    const initialPatch = dialog.indexOf('this.initialValue()')
    expect(editPatch).toBeGreaterThan(-1)
    expect(guard).toBeGreaterThan(editPatch)
    expect(initialPatch).toBeGreaterThan(guard)
  })
})
