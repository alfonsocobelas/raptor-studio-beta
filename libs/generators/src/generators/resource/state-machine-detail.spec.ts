import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 43 TASK-11: los botones de acción en la ficha emitida — uno por transición cuyo
 * from incluye el estado actual (el resto ni se pinta: la UI enseña la máquina), con
 * disabled mientras corre, y 409 → aviso con el mensaje del dominio + recarga.
 */
describe('la ficha emitida con máquina de estados', () => {
  let tree: Tree
  const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
  })

  it('pinta un botón por transición, visible solo cuando su from incluye el estado actual', () => {
    const detail = read('frontend/contract-detail.component.ts')

    expect(detail).toContain("['active', 'expiring'].includes(item.status)")
    expect(detail).toContain("['expiring'].includes(item.status)")
    expect(detail).toContain('data-testid="transition-terminate"')
    expect(detail).toContain('Terminar')
  })

  it('pulsar deshabilita mientras corre y llama al verbo del servicio', () => {
    const detail = read('frontend/contract-detail.component.ts')

    expect(detail).toContain('[disabled]="transitioning()"')
    expect(detail).toContain('async terminate(id: string): Promise<void> {')
    expect(detail).toContain('await this._service.terminate(id)')
  })

  it('el rechazo avisa con el mensaje del dominio y la ficha se recarga siempre', () => {
    const detail = read('frontend/contract-detail.component.ts')

    expect(detail).toMatch(/catch[\s\S]{0,200}_notify\.error/)
    expect(detail).toMatch(/finally[\s\S]{0,120}await this\.load\(\)/)
  })

  it('el spec emitido de la ficha cubre la transición', () => {
    const spec = read('frontend/contract-detail.component.spec.ts')

    expect(spec).toContain('component.terminate(')
    expect(spec).toContain('terminate: vi.fn().mockResolvedValue(undefined)')
  })

  it('una ficha sin máquina no lleva nada de esto', async () => {
    const clean = createTreeWithEmptyWorkspace()
    await resourceGenerator(clean, { name: 'project', directory: 'out' })

    const detail = clean.read('out/frontend/project-detail.component.ts', 'utf-8') ?? ''
    expect(detail).not.toContain('transitioning')
  })
})
