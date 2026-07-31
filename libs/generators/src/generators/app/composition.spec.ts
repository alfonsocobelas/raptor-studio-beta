import { defineApp, type ResourceDefinition } from '@acc/schema'
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
