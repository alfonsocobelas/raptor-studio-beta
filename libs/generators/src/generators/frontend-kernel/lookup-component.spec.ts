import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { frontendKernelGenerator } from './frontend-kernel'

/**
 * Spec 66: combobox con búsqueda asíncrona para campos de referencia. CVA con
 * valor id, debounce y lista de resultados — sin el select de Spartan.
 */
describe('frontend-kernel — app-lookup', () => {
  let tree: Tree

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace()
    await frontendKernelGenerator(tree, {})
  })

  const lookup = (): string => tree.read('tmp/generated/frontend-kernel/shared/components/ui/lookup.ts', 'utf-8') ?? ''

  it('emite el componente como CVA con valor string|null', () => {
    expect(lookup()).toContain('export class AppLookup implements ControlValueAccessor')
    expect(lookup()).toContain('NG_VALUE_ACCESSOR')
    expect(lookup()).toContain('writeValue(value: string | null)')
  })

  it('busca con debounce y reutiliza el contrato de opciones del select', () => {
    expect(lookup()).toContain('searchChange')
    expect(lookup()).toContain('setTimeout')
    expect(lookup()).toContain('AppSelectOption')
  })
})
