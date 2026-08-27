import type { DashboardBlock } from './app-types'
import { normalizeDashboardBlocks } from './normalize-dashboard'

describe('normalizeDashboardBlocks — el alias kpi-count (spec 70)', () => {
  it('traduce kpi-count a un bloque kpi con su condición de igualdad', () => {
    const blocks: DashboardBlock[] = [
      { kind: 'kpi-count', resource: 'project', field: 'status', equals: 'planning', label: 'En planificación' }
    ]

    expect(normalizeDashboardBlocks(blocks)).toEqual([
      {
        kind: 'kpi',
        resource: 'project',
        label: 'En planificación',
        measure: 'count',
        condition: { field: 'status', operator: 'eq', value: 'planning' }
      }
    ])
  })

  it('conserva el ancho declarado por el alias', () => {
    const blocks: DashboardBlock[] = [
      { kind: 'kpi-count', resource: 'project', field: 'status', equals: 'planning', label: 'X', width: 'full' }
    ]

    expect(normalizeDashboardBlocks(blocks)[0].width).toBe('full')
  })

  it('deja intactos los bloques que no son el alias', () => {
    const blocks: DashboardBlock[] = [
      { kind: 'metrics', resources: ['project'] },
      { kind: 'top-n', resource: 'project', field: 'amount', n: 5 },
      { kind: 'series', resource: 'project', field: 'createdAt' }
    ]

    expect(normalizeDashboardBlocks(blocks)).toEqual(blocks)
  })

  it('completa measure count en un kpi que no la declara', () => {
    const blocks: DashboardBlock[] = [{ kind: 'kpi', resource: 'project', label: 'Total' }]

    expect(normalizeDashboardBlocks(blocks)[0]).toMatchObject({ kind: 'kpi', measure: 'count' })
  })
})
