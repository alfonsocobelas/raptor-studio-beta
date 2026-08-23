import type { ResourceDefinition } from '@raptor/schema'
import { shellSubstitutions } from './app'
import { composeApp, composeFlat } from './composition'

/**
 * Spec 59: el calendario es OTRA proyección del listado, derivada de `calendar`.
 * Espejo de galería y cronograma: página propia con nav, ruta `<ruta>/calendario`
 * declarada antes de `:id`.
 */
describe('composeFlat + shellSubstitutions — calendario (spec 59)', () => {
  const model = (extra: object = {}): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name: 'order',
      plural: 'orders',
      context: 'crm',
      schemaName: 'crm',
      fields: {
        id: { type: 'uuid', pk: true },
        deliveryDate: { type: 'date' }
      },
      ...extra
    }) as ResourceDefinition

  it('composeFlat deriva la página «· calendario» de model.calendar', () => {
    const composition = composeFlat([model({ calendar: { date: 'deliveryDate' } })], false)

    expect(composition.pages).toContainEqual({ kind: 'calendar', resource: 'order', label: 'orders · calendario' })
  })

  it('sin calendar no hay página de calendario', () => {
    const composition = composeFlat([model()], false)

    expect(composition.pages.some(p => p.kind === 'calendar')).toBe(false)
  })

  it('composeApp etiqueta la vista declarada en el app-schema con el sufijo', () => {
    const definition = {
      schemaVersion: 1 as const,
      name: 'demo',
      pages: [
        { kind: 'resource' as const, resource: 'order' },
        { kind: 'calendar' as const, resource: 'order' }
      ]
    }
    const composition = composeApp(definition as never, { order: model({ calendar: { date: 'deliveryDate' } }) })

    expect(composition.pages[1].label).toBe('orders · calendario')
  })

  it('registra <ruta>/calendario con su entrada de menú', () => {
    const subs = shellSubstitutions(composeFlat([model({ calendar: { date: 'deliveryDate' } })], false))

    expect(subs.routeEntries).toContain("path: 'crm/orders/calendario'")
    expect(subs.routeEntries).toContain('OrdersCalendarComponent')
    expect(subs.navItems).toContain("{ label: 'orders · calendario', route: '/crm/orders/calendario' }")
  })

  it('el calendario va ANTES de :id, o la ficha capturaría «calendario» como id', () => {
    const subs = shellSubstitutions(composeFlat([model({ calendar: { date: 'deliveryDate' }, detail: {} })], false))

    expect(subs.routeEntries.indexOf('orders/calendario')).toBeLessThan(subs.routeEntries.indexOf('orders/:id'))
  })
})
