import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { frontendKernelGenerator } from './frontend-kernel'

/**
 * Spec 54: un campo de 2000 caracteres emitía una columna SIN TECHO. La celda no envolvía
 * (`whitespace-nowrap` ya estaba), pero la columna crecía a lo ancho hasta empujar el resto
 * de los datos fuera de la pantalla. La tabla aprende a obedecer un techo: una línea, corte
 * con elipsis y el texto completo en el tooltip.
 */
describe('frontend kernel — celda de texto largo', () => {
  const emit = async (): Promise<Tree> => {
    const tree = createTreeWithEmptyWorkspace()
    await frontendKernelGenerator(tree, { directory: 'out', ui: 'spartan' })
    return tree
  }

  const COMPONENT = 'out/shared/components/data-table.ts'
  const SPEC = 'out/shared/components/data-table.spec.ts'

  it('una columna puede declarar su techo de ancho', async () => {
    const component = (await emit()).read(COMPONENT, 'utf-8') ?? ''

    expect(component).toContain('maxWidth?: number')
  })

  it('la celda con techo corta con elipsis y ofrece el texto completo en el tooltip', async () => {
    const component = (await emit()).read(COMPONENT, 'utf-8') ?? ''

    expect(component).toContain('@else if (col.maxWidth)')
    // el techo va en el bloque de dentro: en una tabla con min-width max-content el
    // max-width de la celda es consejo, no ley
    expect(component).toContain('class="block truncate"')
    expect(component).toContain('[style.max-width.px]="col.maxWidth"')
    expect(component).toContain('[hlmTooltip]="text"')
  })

  it('la suite emitida cubre el corte', async () => {
    const spec = (await emit()).read(SPEC, 'utf-8') ?? ''

    expect(spec).toContain('maxWidth')
  })
})
