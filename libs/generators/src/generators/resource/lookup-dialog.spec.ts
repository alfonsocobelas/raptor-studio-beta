import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'

/**
 * Spec 66: los campos de referencia del diálogo dejan el desplegable paginado
 * y pasan al combobox asíncrono — búsqueda con debounce, siembra inicial y
 * resolución de la etiqueta vigente al editar.
 */
describe('resource generator — lookup asíncrono en el diálogo', () => {
  let dialog: string

  beforeAll(async () => {
    registerModels([MODELS['customer'], MODELS['contract']])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
    dialog = tree.read('out/frontend/contract-dialog.component.ts', 'utf-8') ?? ''
  })

  it('el campo de referencia usa app-lookup con búsqueda', () => {
    expect(dialog).toContain('<app-lookup')
    expect(dialog).toContain('(searchChange)="onCustomerIdSearch($event)"')
    expect(dialog).toContain("import { AppLookup } from '../../../../../../shared/components/ui/lookup'")
  })

  it('las opciones nacen de lookup(term), no de la lectura paginada compartida', () => {
    expect(dialog).toContain('this._customerService.lookup(term)')
    expect(dialog).not.toContain('.value()?.items')
  })

  it('pagina el desplegable: término y página por campo, y el botón Ver más carga la siguiente', () => {
    expect(dialog).toContain('(loadMore)="onCustomerIdMore()"')
    expect(dialog).toContain('[hasMore]="customerIdHasMore()"')
    expect(dialog).toContain('this._customerIdPage += 1')
  })

  it('la siembra inicial y la etiqueta del referenciado al editar', () => {
    expect(dialog).toContain("this.onCustomerIdSearch('')")
    expect(dialog).toContain('this._customerService.findOne(')
  })
})
