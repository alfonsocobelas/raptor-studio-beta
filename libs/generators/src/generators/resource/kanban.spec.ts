import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * Spec 61 (22F): el kanban es OTRA LECTURA del listado — mismo servicio, mismo
 * endpoint — con una columna por valor del enum. Sobre el campo de la máquina de
 * estados, mover una tarjeta dispara la transición; sobre un enum normal, el update.
 */
describe('resource generator — kanban', () => {
  const generate = async (extra: Partial<ResourceDefinition>): Promise<Tree> => {
    registerModels([{ ...MODELS['contract'], ...extra } as ResourceDefinition])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
    return tree
  }

  const emitted = async (extra: Partial<ResourceDefinition>): Promise<string> => {
    const tree = await generate(extra)
    return tree.read('out/frontend/contracts-kanban.component.ts', 'utf-8') ?? ''
  }

  afterEach(() => registerModels([MODELS['contract']]))

  it('no emite kanban si el modelo no lo declara', async () => {
    const tree = await generate({ kanban: undefined })

    expect(tree.exists('out/frontend/contracts-kanban.component.ts')).toBe(false)
  })

  it('reutiliza el servicio del recurso: ni endpoint ni estado propios', async () => {
    const kanban = await emitted({ kanban: { field: 'status' } })

    expect(kanban).toContain('ContractService')
    expect(kanban).not.toContain('HttpClient')
  })

  it('sobre el campo de estado, soltar en una columna dispara la transición legal', async () => {
    const kanban = await emitted({ kanban: { field: 'status' } })

    // los movimientos legales viajan pre-masticados y el drop llama al método de transición
    expect(kanban).toContain("{ from: 'active', to: 'terminated', method: 'terminate' }")
    expect(kanban).toContain("{ from: 'expiring', to: 'expired', method: 'expire' }")
    expect(kanban).not.toContain('.update(')
  })

  it('sobre un enum normal, soltar actualiza el campo con el update parcial', async () => {
    const kanban = await emitted({ kanban: { field: 'source' } })

    expect(kanban).toContain('.update(')
    expect(kanban).toContain('source: value')
    expect(kanban).not.toContain('legalMoves')
  })

  it('pinta una columna por valor del enum con su etiqueta humana', async () => {
    const kanban = await emitted({ kanban: { field: 'status' } })

    expect(kanban).toContain("{ value: 'active', label: 'Activo' }")
    expect(kanban).toContain("{ value: 'terminated', label: 'Terminado' }")
  })
})
