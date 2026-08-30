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
    expect(detail).toContain('data-testid="transition-terminate"')
    expect(detail).toContain('Terminar')
  })

  // La curación (spec 74): expire está hidden en el modelo — la ficha lo omite, el resto de la app no.
  describe('una transición hidden', () => {
    it('no pinta botón ni método en la ficha, y las visibles siguen', () => {
      const detail = read('frontend/contract-detail.component.ts')

      expect(detail).not.toContain('data-testid="transition-expire"')
      expect(detail).not.toContain('async expire(id: string, version: number)')
      expect(detail).not.toContain("['expiring'].includes(item.status)")
      expect(detail).toContain('data-testid="transition-terminate"')
    })

    it('el spec emitido de la ficha no ejercita la transición oculta', () => {
      const spec = read('frontend/contract-detail.component.spec.ts')

      expect(spec).not.toContain('component.expire(')
      expect(spec).toContain('component.terminate(')
    })

    it('conserva su endpoint, su use case y su método del servicio front (el kanban lo usa)', () => {
      expect(read('backend/infrastructure/entrypoints/contracts.controller.ts')).toContain(":id/expire'")
      expect(read('backend/application/use-cases/expire-contract-usecase.service.ts')).toContain('ExpireContract')
      expect(read('frontend/contract.service.ts')).toContain('expire(id: string, version: number)')
    })

    it('el kanban sigue moviendo por la transición oculta', () => {
      expect(read('frontend/contracts-kanban.component.ts')).toContain('expire')
    })
  })

  it('pulsar deshabilita mientras corre y llama al verbo del servicio', () => {
    const detail = read('frontend/contract-detail.component.ts')

    expect(detail).toContain('[disabled]="transitioning()"')
    expect(detail).toContain('async terminate(id: string, version: number): Promise<void> {')
    expect(detail).toContain('await this._service.terminate(id, version)')
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
