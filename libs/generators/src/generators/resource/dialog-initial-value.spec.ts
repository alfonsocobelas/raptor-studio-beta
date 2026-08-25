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

  it('expone el input opcional initialValue tipado sin nulos', async () => {
    const dialog = await dialogOf()

    // El FormValue es el payload de SALIDA: sus opcionales son nullables porque el backend los
    // quiere null. El valor de ENTRADA no puede serlo — los controles del form no son nullable
    // (salvo el lookup), así que patchValue(FormValue) no compilaba. Detectado el 2026-08-25
    // construyendo una app emitida: TS2345 en el diálogo y en la página-formulario.
    expect(dialog).toContain('export type SupplierFormInitial = Partial<')
    expect(dialog).toContain('NonNullable<SupplierFormValue[K]>')
    expect(dialog).toContain('readonly initialValue = input<SupplierFormInitial | null>(null)')
  })

  it('sin entidad, el effect precarga el formulario con initialValue', async () => {
    const dialog = await dialogOf()

    expect(dialog).toMatch(
      /const initial = this\.initialValue\(\)\s*\n\s*if \(initial\) \{\s*\n\s*this\.form\.patchValue\(initial\)/
    )
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
