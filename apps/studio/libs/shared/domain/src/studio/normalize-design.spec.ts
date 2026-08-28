import { describe, expect, it } from 'vitest'
import type { DesignPage } from './design-page'
import { normalizeDesignPages } from './normalize-design'

describe('normalizeDesignPages — los diseños guardados hablan bloques sueltos (spec 73)', () => {
  const pageWith = (blocks: object[]): DesignPage[] => [{ title: 'Panel', blocks: blocks as DesignPage['blocks'] }]

  it('convierte un kpi suelto en una fila de una celda, campo a campo', () => {
    const pages = pageWith([
      {
        kind: 'kpi',
        resource: 'pedido',
        width: 'half',
        kpiLabel: 'Pendientes',
        kpiMeasure: 'count',
        kpiConditionField: 'estado',
        kpiConditionOperator: 'eq',
        kpiConditionValue: 'pendiente',
        kpiRatio: true
      }
    ])

    expect(normalizeDesignPages(pages)).toEqual(
      pageWith([
        {
          kind: 'kpis',
          width: 'half',
          items: [
            {
              kind: 'kpi',
              resource: 'pedido',
              kpiLabel: 'Pendientes',
              kpiMeasure: 'count',
              kpiConditionField: 'estado',
              kpiConditionOperator: 'eq',
              kpiConditionValue: 'pendiente',
              kpiRatio: true
            }
          ]
        }
      ])
    )
  })

  it('convierte top-n, barras y evolución en filas de una celda', () => {
    const pages = pageWith([
      { kind: 'top-n', resource: 'pedido', topField: 'importe', topN: 5, topDir: 'desc' },
      { kind: 'count-by', resource: 'pedido', axisField: 'estado', width: 'full' },
      { kind: 'series', resource: 'pedido', axisField: 'fecha', measure: 'sum', measureField: 'importe' }
    ])

    expect(normalizeDesignPages(pages)).toEqual(
      pageWith([
        { kind: 'kpis', items: [{ kind: 'top-n', resource: 'pedido', topField: 'importe', topN: 5, topDir: 'desc' }] },
        { kind: 'kpis', width: 'full', items: [{ kind: 'count-by', resource: 'pedido', axisField: 'estado' }] },
        {
          kind: 'kpis',
          items: [{ kind: 'series', resource: 'pedido', axisField: 'fecha', measure: 'sum', measureField: 'importe' }]
        }
      ])
    )
  })

  it('convierte el kpis de contadores (resources) en celdas counter', () => {
    const pages = pageWith([{ kind: 'kpis', resources: ['pedido', 'cliente'], width: 'full' }])

    expect(normalizeDesignPages(pages)).toEqual(
      pageWith([
        {
          kind: 'kpis',
          width: 'full',
          items: [
            { kind: 'counter', resource: 'pedido' },
            { kind: 'counter', resource: 'cliente' }
          ]
        }
      ])
    )
  })

  it('una fila ya migrada pasa tal cual: es idempotente', () => {
    const pages = pageWith([
      {
        kind: 'kpis',
        items: [
          { kind: 'counter', resource: 'pedido' },
          { kind: 'top-n', resource: 'pedido', topField: 'importe', topN: 3 }
        ]
      },
      { kind: 'table', resource: 'pedido', width: 'full' }
    ])

    const once = normalizeDesignPages(pages)

    expect(once).toEqual(pages)
    expect(normalizeDesignPages(once)).toEqual(once)
  })

  it('los bloques que no son de la familia analítica no se tocan', () => {
    const pages: DesignPage[] = [
      {
        title: 'Agenda',
        drillDown: true,
        blocks: [
          { kind: 'calendar', resource: 'cita', dateField: 'fecha', labelField: 'titulo' },
          { kind: 'text', text: 'Entradilla' }
        ]
      }
    ]

    expect(normalizeDesignPages(pages)).toEqual(pages)
  })
})
