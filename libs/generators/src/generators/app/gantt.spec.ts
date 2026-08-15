import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { ResourceDefinition } from '@raptor/schema'
import { resourceGenerator } from '../resource/resource'
import { shellSubstitutions } from './app'
import { composeFlat } from './composition'

/**
 * Spec 30 (fase 5 · A2): el cronograma es OTRA proyección del listado, derivada
 * de `gantt` (que exige `period`). Espejo de la galería: página propia con nav,
 * ruta `<ruta>/cronograma` declarada antes de `:id`.
 */
describe('composeFlat + shellSubstitutions — cronograma (spec 30)', () => {
  const model = (extra: object = {}): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name: 'contract',
      plural: 'contracts',
      context: 'crm',
      schemaName: 'crm',
      period: { start: 'startDate', end: 'endDate' },
      fields: {
        id: { type: 'uuid', pk: true },
        startDate: { type: 'date' },
        endDate: { type: 'date', nullable: true }
      },
      ...extra
    }) as ResourceDefinition

  it('composeFlat deriva la página «· cronograma» de model.gantt', () => {
    const composition = composeFlat([model({ gantt: {} })], false)

    expect(composition.pages).toContainEqual({ kind: 'gantt', resource: 'contract', label: 'contracts · cronograma' })
  })

  it('sin gantt no hay página de cronograma', () => {
    const composition = composeFlat([model()], false)

    expect(composition.pages.some(p => p.kind === 'gantt')).toBe(false)
  })

  it('registra <ruta>/cronograma con su entrada de menú', () => {
    const subs = shellSubstitutions(composeFlat([model({ gantt: {} })], false))

    expect(subs.routeEntries).toContain("path: 'crm/contracts/cronograma'")
    expect(subs.routeEntries).toContain('ContractsGanttComponent')
    expect(subs.navItems).toContain("{ label: 'contracts · cronograma', route: '/crm/contracts/cronograma' }")
  })

  it('el cronograma va ANTES de :id, o la ficha capturaría «cronograma» como id', () => {
    const subs = shellSubstitutions(composeFlat([model({ gantt: {}, detail: {} })], false))

    expect(subs.routeEntries.indexOf('contracts/cronograma')).toBeLessThan(subs.routeEntries.indexOf('contracts/:id'))
  })
})

describe('resource generator — componente de cronograma (spec 30)', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }

  it('contract (gantt + period) emite el componente con eje y barras derivados del period', async () => {
    const tree = await emit('contract')

    const component = tree.read('out/frontend/contracts-gantt.component.ts', 'utf-8') ?? ''
    expect(component).toContain('export class ContractsGanttComponent')
    // los campos del period viajan como sustituciones, no se infieren en runtime
    expect(component).toContain("readonly startField = 'startDate'")
    expect(component).toContain("readonly endField = 'endDate'")
    // la barra se etiqueta con el primer texto buscable (contractNumber en el canon)
    expect(component).toContain("readonly barLabel = 'contractNumber'")
    expect(component).toContain('sin fechas')
  })

  it('customer (sin gantt) no emite cronograma', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/frontend/customers-gantt.component.ts')).toBe(false)
  })
})
