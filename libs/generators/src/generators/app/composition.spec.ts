import { defineApp, type AppDefinition, type ResourceDefinition } from '@raptor/schema'
import { composeApp, composeFlat } from './composition'

const model = (name: string, plural: string, labelPlural?: string): ResourceDefinition =>
  ({
    schemaVersion: 1,
    name,
    plural,
    context: 'crm',
    schemaName: 'crm',
    labels: labelPlural ? { plural: labelPlural } : undefined,
    fields: { id: { type: 'uuid', pk: true } }
  }) as ResourceDefinition

const customer = model('customer', 'customers', 'Clientes')
const contract = model('contract', 'contracts')
const registry = { customer, contract }

describe('composeFlat', () => {
  it('reproduces the flat composition: one resource page per model, in order', () => {
    const composition = composeFlat([customer, contract], false)

    expect(composition.models).toEqual([customer, contract])
    expect(composition.dashboard).toBe(false)
    expect(composition.kpiModels).toEqual([])
    expect(composition.pages).toEqual([
      { kind: 'resource', resource: 'customer', label: 'Clientes' },
      { kind: 'resource', resource: 'contract', label: 'contracts' }
    ])
  })

  it('prepends the dashboard page with one kpi per model when enabled', () => {
    const composition = composeFlat([customer, contract], true)

    expect(composition.dashboard).toBe(true)
    expect(composition.kpiModels).toEqual([customer, contract])
    expect(composition.pages[0]).toEqual({
      kind: 'dashboard',
      label: 'Dashboard',
      widgets: [
        { kind: 'kpi-total', resource: 'customer' },
        { kind: 'kpi-total', resource: 'contract' }
      ]
    })
  })
})

describe('composeApp — página form (spec 48)', () => {
  it('resuelve la página form contra el registro y etiqueta por defecto con sufijo', () => {
    const app = defineApp({
      schemaVersion: 1,
      name: 'demo',
      pages: [
        { kind: 'resource', resource: 'customer' },
        { kind: 'form', resource: 'customer' }
      ]
    })

    const composition = composeApp(app, registry)

    expect(composition.models).toEqual([customer])
    expect(composition.pages[1]).toEqual({ kind: 'form', resource: 'customer', label: 'Clientes · formulario' })
  })

  it('la etiqueta del diseño manda cuando existe', () => {
    const app = defineApp({
      schemaVersion: 1,
      name: 'demo',
      pages: [{ kind: 'form', resource: 'customer', label: 'Solicitud' }]
    })

    expect(composeApp(app, registry).pages[0]).toEqual({ kind: 'form', resource: 'customer', label: 'Solicitud' })
  })
})

describe('composeApp', () => {
  it('derives models, pages and kpis from the app definition, page order first', () => {
    const app = defineApp({
      schemaVersion: 1,
      name: 'demo',
      pages: [
        { kind: 'dashboard', widgets: [{ kind: 'kpi-total', resource: 'contract' }] },
        { kind: 'resource', resource: 'contract', label: 'Contratos' },
        { kind: 'resource', resource: 'customer' }
      ]
    })

    const composition = composeApp(app, registry)

    expect(composition.models).toEqual([contract, customer])
    expect(composition.dashboard).toBe(true)
    expect(composition.kpiModels).toEqual([contract])
    expect(composition.pages).toEqual([
      { kind: 'dashboard', label: 'Dashboard', widgets: [{ kind: 'kpi-total', resource: 'contract' }] },
      { kind: 'resource', resource: 'contract', label: 'Contratos' },
      { kind: 'resource', resource: 'customer', label: 'Clientes' }
    ])
  })

  it('includes widget-only resources in models but not as pages', () => {
    const app = defineApp({
      schemaVersion: 1,
      name: 'demo',
      pages: [
        { kind: 'dashboard', widgets: [{ kind: 'kpi-total', resource: 'contract' }] },
        { kind: 'resource', resource: 'customer' }
      ]
    })

    const composition = composeApp(app, registry)

    expect(composition.models).toEqual([contract, customer])
    expect(composition.pages.filter(p => p.kind === 'resource')).toEqual([
      { kind: 'resource', resource: 'customer', label: 'Clientes' }
    ])
  })

  it('rejects a page resource missing from the registry, listing the available models', () => {
    const app = defineApp({
      schemaVersion: 1,
      name: 'demo',
      pages: [{ kind: 'resource', resource: 'invoice' }]
    })

    expect(() => composeApp(app, registry)).toThrow(
      "App 'demo' references unknown resource model 'invoice'. Available models: customer, contract"
    )
  })

  it('rejects a widget resource missing from the registry', () => {
    const app = defineApp({
      schemaVersion: 1,
      name: 'demo',
      pages: [{ kind: 'dashboard', widgets: [{ kind: 'kpi-total', resource: 'invoice' }] }]
    })

    expect(() => composeApp(app, registry)).toThrow("App 'demo' references unknown resource model 'invoice'")
  })
})

describe('composeApp — tema (spec 18)', () => {
  const registry = {
    paciente: { name: 'paciente', plural: 'pacientes', context: 'clinica' } as unknown as ResourceDefinition
  }

  it('el tema declarado viaja en la composición', () => {
    const composed = composeApp(
      {
        schemaVersion: 1,
        name: 'clinica',
        theme: { id: 'ocean' },
        pages: [{ kind: 'resource', resource: 'paciente' }]
      } as AppDefinition,
      registry
    )

    expect(composed.themeId).toBe('ocean')
  })

  it('el alias palette de la spec 18 sigue viajando', () => {
    const composed = composeApp(
      {
        schemaVersion: 1,
        name: 'clinica',
        theme: { palette: 'ocean' },
        pages: [{ kind: 'resource', resource: 'paciente' }]
      } as AppDefinition,
      registry
    )

    expect(composed.themeId).toBe('ocean')
  })

  it('sin tema declarado la composición es neutra', () => {
    const composed = composeApp(
      { schemaVersion: 1, name: 'clinica', pages: [{ kind: 'resource', resource: 'paciente' }] } as AppDefinition,
      registry
    )

    expect(composed.themeId).toBe('neutral')
  })
})

describe('composeApp — el estado del paso es coherente con el enum (spec 39)', () => {
  // fixture propia: un modelo CON enum de estado y otro sin ningún enum
  const order = {
    ...model('order', 'orders'),
    fields: {
      id: { type: 'uuid', pk: true },
      status: { type: 'string', vo: { name: 'OrderStatus', fieldName: 'Order status', values: ['draft', 'open', 'closed'] } }
    }
  } as ResourceDefinition
  const plain = model('plain', 'plains')
  const shop = { order, plain }

  const appWith = (node: Record<string, unknown>, resource = 'order'): AppDefinition =>
    defineApp({
      schemaVersion: 1,
      name: 'demo',
      pages: [{ kind: 'resource', resource }],
      flows: [
        {
          name: 'Ciclo del pedido',
          nodes: [
            { id: 'inicio', kind: 'start', text: 'llega el pedido' },
            { id: 'abrir', kind: 'step', text: 'se abre el pedido', ...node },
            { id: 'fin', kind: 'end', text: 'cerrado' }
          ],
          edges: [
            { from: 'inicio', to: 'abrir' },
            { from: 'abrir', to: 'fin' }
          ]
        }
      ]
    })

  it('acepta un estado que existe en el enum del modelo', () => {
    const composition = composeApp(appWith({ entity: 'order', status: 'open' }), shop)

    expect(composition.flows?.[0].nodes[1].status).toBe('open')
  })

  it('rechaza al DISEÑAR un estado que el modelo no tiene, y dice cuáles hay', () => {
    // el error llega al diseñar, no al compilar: mismo criterio que los widgets analíticos
    const build = () => composeApp(appWith({ entity: 'order', status: 'en_curso' }), shop)

    expect(build).toThrow(/en_curso/)
    expect(build).toThrow(/draft, open, closed/)
  })

  it('rechaza un estado si la entidad no tiene ningún campo enum', () => {
    expect(() => composeApp(appWith({ entity: 'plain', status: 'cualquiera' }, 'plain'), shop)).toThrow(/enum/)
  })

  it('un flujo sin estados declarados pasa igual que antes', () => {
    expect(() => composeApp(appWith({ entity: 'order' }), shop)).not.toThrow()
  })

  it('un estado del enum que ningún paso alcanza NO es un error', () => {
    // 'closed' no lo alcanza nadie y da igual: la coherencia va en un solo sentido
    expect(() => composeApp(appWith({ entity: 'order', status: 'open' }), shop)).not.toThrow()
  })
})
