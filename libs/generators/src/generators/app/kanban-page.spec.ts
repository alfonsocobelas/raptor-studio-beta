import type { ResourceDefinition } from '@raptor/schema'
import { shellSubstitutions } from './app'
import { composeApp, composeFlat } from './composition'

/**
 * Spec 61: el kanban es OTRA proyección del listado, derivada de `kanban`.
 * Espejo de galería/cronograma/calendario: ruta `<ruta>/tablero` antes de `:id`.
 */
describe('composeFlat + shellSubstitutions — kanban (spec 61)', () => {
  const model = (extra: object = {}): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name: 'order',
      plural: 'orders',
      context: 'crm',
      schemaName: 'crm',
      fields: {
        id: { type: 'uuid', pk: true },
        status: {
          type: 'string',
          vo: { name: 'OrderStatus', fieldName: 'Status', values: ['pending', 'delivered'] }
        }
      },
      ...extra
    }) as ResourceDefinition

  it('composeFlat deriva la página «· tablero» de model.kanban', () => {
    const composition = composeFlat([model({ kanban: { field: 'status' } })], false)

    expect(composition.pages).toContainEqual({ kind: 'kanban', resource: 'order', label: 'orders · tablero' })
  })

  it('sin kanban no hay página de tablero', () => {
    const composition = composeFlat([model()], false)

    expect(composition.pages.some(p => p.kind === 'kanban')).toBe(false)
  })

  it('composeApp etiqueta la vista declarada en el app-schema con el sufijo', () => {
    const definition = {
      schemaVersion: 1 as const,
      name: 'demo',
      pages: [
        { kind: 'resource' as const, resource: 'order' },
        { kind: 'kanban' as const, resource: 'order' }
      ]
    }
    const composition = composeApp(definition as never, { order: model({ kanban: { field: 'status' } }) })

    expect(composition.pages[1].label).toBe('orders · tablero')
  })

  it('registra <ruta>/tablero con su entrada de menú', () => {
    const subs = shellSubstitutions(composeFlat([model({ kanban: { field: 'status' } })], false))

    expect(subs.routeEntries).toContain("path: 'crm/orders/tablero'")
    expect(subs.routeEntries).toContain('OrdersKanbanComponent')
    expect(subs.navItems).toContain("{ label: 'orders · tablero', route: '/crm/orders/tablero' }")
  })

  it('el tablero va ANTES de :id, o la ficha capturaría «tablero» como id', () => {
    const subs = shellSubstitutions(composeFlat([model({ kanban: { field: 'status' }, detail: {} })], false))

    expect(subs.routeEntries.indexOf('orders/tablero')).toBeLessThan(subs.routeEntries.indexOf('orders/:id'))
  })
})
