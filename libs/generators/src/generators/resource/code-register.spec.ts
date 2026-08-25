import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 19 TASK-04: el corazón de la feature. El alta decide entre dos caminos —
 *
 *   sin code en el input  → pide número a la secuencia y lo formatea (CLI-0001)
 *   con code en el input  → lo respeta tal cual (importación de otro sistema, §2.bis)
 *
 * y el update no lo toca jamás.
 */
describe('alta con código de negocio', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }

  const useCase = (tree: Tree) =>
    tree.read('out/backend/application/use-cases/register-client-usecase.service.ts', 'utf-8') ?? ''

  it('inyecta el puerto de secuencia', async () => {
    const source = useCase(await emit('client'))

    expect(source).toContain('CodeSequencePort')
  })

  it('respeta el código que venga en el input y solo pide número si falta', async () => {
    const source = useCase(await emit('client'))

    // el ?? es la regla entera: si viene, se usa; si no, se pide
    expect(source).toMatch(/input\.code\s*\?\?/)
    expect(source).toContain("next('clients')")
  })

  it('formatea con el prefijo y el relleno declarados en el modelo', async () => {
    const source = useCase(await emit('client'))

    expect(source).toContain("'CLI-'")
    expect(source).toContain('padStart(4')
  })

  it('un recurso sin código no menciona la secuencia', async () => {
    const tree = await emit('vehicle')
    const source = tree.read('out/backend/application/use-cases/register-vehicle-usecase.service.ts', 'utf-8') ?? ''

    expect(source).not.toContain('CodeSequencePort')
  })
})
