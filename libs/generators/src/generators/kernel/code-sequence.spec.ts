import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { kernelGenerator } from './kernel'

/**
 * Spec 19 TASK-02: el código de negocio (`PAC-0001`) necesita un contador que dos altas
 * simultáneas no puedan compartir. Va tras un puerto de dominio: la secuencia es persistencia
 * y el agregado no la conoce, igual que el resto del canon.
 *
 * Solo se emite si algún modelo declara `code` — mismo criterio que adjuntos e historial.
 */
describe('kernel — puerto de secuencia de códigos', () => {
  const emit = async (models?: string): Promise<Tree> => {
    const tree = createTreeWithEmptyWorkspace()
    await kernelGenerator(tree, { directory: 'out', models })
    return tree
  }

  const PORT = 'out/contexts/shared/domain/code/code-sequence.port.ts'
  const ADAPTER = 'out/contexts/shared/infrastructure/code/typeorm-code-sequence.ts'

  // los cuatro modelos de oro NO declaran código: el gate de oro debe seguir vacío
  it('sin ningún modelo con código no se emite nada', async () => {
    const tree = await emit('customer,contract,license,project')

    expect(tree.exists(PORT)).toBe(false)
    expect(tree.exists(ADAPTER)).toBe(false)
  })

  it('el puerto declara el contrato mínimo: pedir el siguiente código de una entidad', async () => {
    const tree = await emit('client')

    const port = tree.read(PORT, 'utf-8') ?? ''
    expect(port).toContain('abstract class CodeSequencePort')
    expect(port).toContain('abstract next(')
  })

  it('el adapter TypeORM usa nextval: MAX(code)+1 sería una carrera entre altas simultáneas', async () => {
    const tree = await emit('client')

    const adapter = tree.read(ADAPTER, 'utf-8') ?? ''
    expect(adapter).toContain('nextval')
    expect(adapter).toContain('extends CodeSequencePort')
  })
})
