import type { DashboardBlock } from './app-types'
import { normalizeDashboardBlocks } from './normalize-dashboard'

describe('normalizeDashboardBlocks — el alias kpi-count (spec 70)', () => {
  it('traduce kpi-count a un bloque kpi con su condición de igualdad', () => {
    const blocks: DashboardBlock[] = [
      { kind: 'kpi-count', resource: 'project', field: 'status', equals: 'planning', label: 'En planificación' }
    ]

    expect(normalizeDashboardBlocks(blocks)).toEqual([
      {
        kind: 'kpi-row',
        cells: [
          {
            kind: 'kpi',
            resource: 'project',
            label: 'En planificación',
            measure: 'count',
            condition: { field: 'status', operator: 'eq', value: 'planning' }
          }
        ]
      }
    ])
  })

  it('conserva el ancho declarado por el alias', () => {
    const blocks: DashboardBlock[] = [
      { kind: 'kpi-count', resource: 'project', field: 'status', equals: 'planning', label: 'X', width: 'full' }
    ]

    expect(normalizeDashboardBlocks(blocks)[0].width).toBe('full')
  })

  it('completa measure count en un kpi que no la declara', () => {
    const blocks: DashboardBlock[] = [{ kind: 'kpi', resource: 'project', label: 'Total' }]

    expect(normalizeDashboardBlocks(blocks)[0]).toMatchObject({
      kind: 'kpi-row',
      cells: [{ kind: 'kpi', measure: 'count' }]
    })
  })
})

describe('normalizeDashboardBlocks — la familia analítica se lee como filas (spec 73)', () => {
  it('envuelve un kpi suelto en una fila de una celda, con el ancho en la fila', () => {
    const blocks: DashboardBlock[] = [{ kind: 'kpi', resource: 'project', label: 'Total', width: 'half' }]

    expect(normalizeDashboardBlocks(blocks)).toEqual([
      {
        kind: 'kpi-row',
        cells: [{ kind: 'kpi', resource: 'project', label: 'Total', measure: 'count' }],
        width: 'half'
      }
    ])
  })

  it('traduce metrics a una fila con una celda counter por recurso', () => {
    const blocks: DashboardBlock[] = [{ kind: 'metrics', resources: ['project', 'contract'] }]

    expect(normalizeDashboardBlocks(blocks)).toEqual([
      {
        kind: 'kpi-row',
        cells: [
          { kind: 'counter', resource: 'project' },
          { kind: 'counter', resource: 'contract' }
        ]
      }
    ])
  })

  it('envuelve top-n, count-by y series sueltos en filas de una celda', () => {
    const blocks: DashboardBlock[] = [
      { kind: 'top-n', resource: 'project', field: 'amount', n: 5 },
      { kind: 'count-by', resource: 'project', field: 'status' },
      { kind: 'series', resource: 'project', field: 'createdAt', width: 'half' }
    ]

    expect(normalizeDashboardBlocks(blocks)).toEqual([
      { kind: 'kpi-row', cells: [{ kind: 'top-n', resource: 'project', field: 'amount', n: 5 }] },
      { kind: 'kpi-row', cells: [{ kind: 'count-by', resource: 'project', field: 'status' }] },
      { kind: 'kpi-row', cells: [{ kind: 'series', resource: 'project', field: 'createdAt' }], width: 'half' }
    ])
  })

  it('el alias kpi-count acaba también dentro de una fila', () => {
    const blocks: DashboardBlock[] = [
      { kind: 'kpi-count', resource: 'project', field: 'status', equals: 'planning', label: 'X' }
    ]

    expect(normalizeDashboardBlocks(blocks)).toEqual([
      {
        kind: 'kpi-row',
        cells: [
          {
            kind: 'kpi',
            resource: 'project',
            label: 'X',
            measure: 'count',
            condition: { field: 'status', operator: 'eq', value: 'planning' }
          }
        ]
      }
    ])
  })

  it('una fila ya escrita pasa tal cual, con la measure de sus celdas kpi resuelta', () => {
    const blocks: DashboardBlock[] = [
      {
        kind: 'kpi-row',
        cells: [
          { kind: 'counter', resource: 'project' },
          { kind: 'kpi', resource: 'project', label: 'Total' },
          { kind: 'top-n', resource: 'project', field: 'amount', n: 5 }
        ]
      }
    ]

    const normalized = normalizeDashboardBlocks(blocks)

    expect(normalized).toEqual([
      {
        kind: 'kpi-row',
        cells: [
          { kind: 'counter', resource: 'project' },
          { kind: 'kpi', resource: 'project', label: 'Total', measure: 'count' },
          { kind: 'top-n', resource: 'project', field: 'amount', n: 5 }
        ]
      }
    ])
  })

  it('es idempotente: normalizar dos veces da lo mismo que una', () => {
    const blocks: DashboardBlock[] = [
      { kind: 'metrics', resources: ['project'] },
      { kind: 'kpi', resource: 'project', label: 'Total' },
      { kind: 'table', resource: 'project' }
    ]

    const once = normalizeDashboardBlocks(blocks)

    expect(normalizeDashboardBlocks(once)).toEqual(once)
  })

  it('el listado embebido no es analítico: table queda fuera de las filas', () => {
    const blocks: DashboardBlock[] = [{ kind: 'table', resource: 'project', width: 'half' }]

    expect(normalizeDashboardBlocks(blocks)).toEqual(blocks)
  })
})
