import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { frontendKernelGenerator } from './frontend-kernel'

/**
 * Spec 35: el DataTable es la pieza más compleja del kernel emitido (~1.000 líneas) y viajaba
 * sin un solo test, así que una regresión ahí solo la veía una demo a mano. Se emite con él la
 * suite del canon, adaptada a lo que este acelerador decidió distinto (fecha dd/MM, defecto 22).
 */
describe('frontend kernel — suite del DataTable', () => {
  const emit = async (ui: 'spartan' | 'material'): Promise<Tree> => {
    const tree = createTreeWithEmptyWorkspace()
    await frontendKernelGenerator(tree, { directory: 'out', ui })
    return tree
  }

  const SPEC = 'out/shared/components/data-table.spec.ts'

  it('spartan emite la suite junto al componente', async () => {
    const tree = await emit('spartan')

    expect(tree.exists(SPEC)).toBe(true)
  })

  it('la suite cubre lo que la tabla hace de verdad, no solo que renderiza', async () => {
    const spec = (await emit('spartan')).read(SPEC, 'utf-8') ?? ''

    expect(spec).toContain('server-side events')
    expect(spec).toContain('closed vocabulary via valueMap')
    expect(spec).toContain('hidden predicate')
    // la fecha es nuestra convención, no la del canon (defecto 22: dd/MM, no dd-MM)
    expect(spec).toContain('17/01/2026')
  })

  it('material no la emite: su tabla es otra y su piel está congelada', async () => {
    const tree = await emit('material')

    expect(tree.exists(SPEC)).toBe(false)
  })
})
