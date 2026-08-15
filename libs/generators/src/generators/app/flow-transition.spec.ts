import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { BusinessFlow } from '@acc/schema'
import { MODELS } from '../resource/models/registry'
import { emitFlowProcesses } from './flow-process'

/**
 * Spec 44 TASK-01: un paso con `transition` deja de ser un hueco @ai — emite cuerpo real
 * determinista (cargar → verbo del agregado → guardar). La guarda vive en el verbo (spec
 * 43): el paso no la duplica. Los pasos sin transición siguen exactamente como estaban.
 */
describe('el paso de flujo convergido con la máquina de estados', () => {
  const flow: BusinessFlow = {
    name: 'Del alta a la baja',
    nodes: [
      { id: 'llega', kind: 'start', text: 'Llega el contrato' },
      { id: 'firma', kind: 'step', text: 'Se firma el contrato', entity: 'contract' },
      { id: 'termina', kind: 'step', text: 'Se termina el contrato', entity: 'contract', transition: 'terminate' },
      { id: 'fin', kind: 'end', text: 'Terminado' }
    ],
    edges: [
      { from: 'llega', to: 'firma' },
      { from: 'firma', to: 'termina' },
      { from: 'termina', to: 'fin' }
    ]
  }

  let tree: Tree
  let source: string

  beforeAll(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('backend/root.module.ts', 'import { HealthModule } from "x"\nimports: [HealthModule,]\n')
    emitFlowProcesses(tree, 'backend', [flow], Object.values(MODELS))
    source =
      tree.read('backend/contexts/sap-licensing/processes/del-alta-a-la-baja/del-alta-a-la-baja.process.ts', 'utf-8') ??
      ''
  })

  it('el paso con transition emite el cuerpo real: cargar → verbo → guardar, sin hueco @ai', () => {
    expect(source).toMatch(/async termina\(id: ContractId\): Promise<void> \{/)
    expect(source).toContain('const contract = await this.contractRepository.get(id)')
    expect(source).toContain("throw new EntityNotFoundError('Contract', id.value)")
    expect(source).toContain('contract.terminate()')
    expect(source).toContain('await this.contractRepository.save(contract)')
    expect(source).not.toContain('@ai:begin flow-termina')
  })

  it('su JSDoc nombra la transición que ejecuta', () => {
    expect(source).toMatch(/Ejecuta la transición «terminate» de contract/)
  })

  it('importa EntityNotFoundError solo cuando hay pasos convergidos', () => {
    expect(source).toContain("import { EntityNotFoundError } from '../../../shared/domain/errors'")
  })

  it('el paso SIN transition sigue siendo un hueco @ai, como en la spec 39', () => {
    expect(source).toContain('// @ai:begin flow-firma — Se firma el contrato')
  })

  it('un flujo sin pasos convergidos no gana el import del error', () => {
    const clean = createTreeWithEmptyWorkspace()
    clean.write('backend/root.module.ts', 'import { HealthModule } from "x"\nimports: [HealthModule,]\n')
    const plain: BusinessFlow = {
      ...flow,
      nodes: flow.nodes.map(node => {
        const { transition: _out, ...rest } = node
        return rest
      })
    }
    emitFlowProcesses(clean, 'backend', [plain], Object.values(MODELS))
    const plainSource =
      clean.read('backend/contexts/sap-licensing/processes/del-alta-a-la-baja/del-alta-a-la-baja.process.ts', 'utf-8') ?? ''

    expect(plainSource).not.toContain('EntityNotFoundError')
    expect(plainSource).toContain('@ai:begin flow-termina')
  })
})
