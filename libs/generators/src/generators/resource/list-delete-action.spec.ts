import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@acc/schema'

/**
 * La papelera de la fila la manda `features.delete`, no la presencia de ficha.
 * La rama con ficha se copió de `customers` del canon, que no borra porque lo
 * gobierna un sincronismo externo (spec 32 de la referencia) — una regla de
 * dominio de ESE proyecto, no una regla de UI. El síntoma de la confusión es que
 * el listado emitía el diálogo, el handler y `remove()` sin ninguna acción que
 * los disparase.
 */
describe('resource generator — acción de borrado del listado', () => {
  const model = (features: Record<string, unknown>, extra: Partial<ResourceDefinition> = {}): ResourceDefinition =>
    ({
      ...MODELS['supplier'],
      name: 'invoice',
      plural: 'invoices',
      ...extra,
      list: {
        ...MODELS['supplier'].list,
        features: { ...MODELS['supplier'].list?.features, ...features }
      }
    }) as ResourceDefinition

  const listOf = async (definition: ResourceDefinition): Promise<string> => {
    registerModels([definition])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: definition.name, directory: 'out' })
    return tree.read('out/frontend/invoices-list.component.ts', 'utf-8') ?? ''
  }

  it('ofrece la papelera en la fila cuando la entidad tiene ficha y es borrable', async () => {
    const list = await listOf(model({ view: true, delete: true, edit: true }, { detail: {} }))

    expect(list).toContain("action: 'delete'")
  })

  it('ofrece ver, editar y borrar juntos: la ficha no sustituye a la papelera', async () => {
    const list = await listOf(model({ view: true, delete: true, edit: true }, { detail: {} }))

    expect(list).toContain("action: 'view'")
    expect(list).toContain("action: 'edit'")
    expect(list).toContain("action: 'delete'")
  })

  it('no ofrece la papelera si el schema declara la entidad no borrable', async () => {
    const list = await listOf(model({ view: true, delete: false, edit: true }, { detail: {} }))

    expect(list).not.toContain("action: 'delete'")
  })

  it('sigue ofreciendo la papelera cuando la entidad no tiene ficha', async () => {
    const list = await listOf(model({ view: false, delete: true, edit: true }))

    expect(list).toContain("action: 'delete'")
  })

  it('no emite el diálogo de borrado si no hay acción que lo dispare', async () => {
    const list = await listOf(model({ view: true, delete: false, edit: true }, { detail: {} }))

    expect(list).not.toContain('deleteDialogOpen')
  })
})
