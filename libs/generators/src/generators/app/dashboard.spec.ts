import type { AppDefinition, ResourceDefinition } from '@raptor/schema'
import { dashboardSubstitutions } from './app'
import type { ComposedDashboardBlock } from './composition'
import { composeApp } from './composition'

const model = (overrides: Partial<ResourceDefinition>): ResourceDefinition =>
  ({
    schemaVersion: 1,
    name: 'contract',
    plural: 'contracts',
    context: 'sap-licensing',
    schemaName: 'sap_licensing',
    fields: [],
    ...overrides
  }) as ResourceDefinition

/** Un panel de una sola fila de métricas: lo que emitían las opciones planas. */
const metricsOnly = (models: ResourceDefinition[]): ComposedDashboardBlock[] => [
  { kind: 'metrics', width: 'full', models }
]

describe('dashboardSubstitutions — bindings del dashboard opcional', () => {
  const models = [
    model({ name: 'contract', plural: 'contracts', labels: { plural: 'Contratos' } } as Partial<ResourceDefinition>),
    model({ name: 'project', plural: 'projects', api: '/api/v1/projects' } as Partial<ResourceDefinition>)
  ]

  it('emite una carga de total por recurso con su endpoint', () => {
    const subs = dashboardSubstitutions(metricsOnly(models))

    expect(subs['resourceEntries']).toContain("readonly contracts = this._total('/api/v1/contracts')")
    expect(subs['resourceEntries']).toContain("readonly projects = this._total('/api/v1/projects')")
    expect(subs['loadingExpr']).toBe('this.contracts.isLoading() || this.projects.isLoading()')
  })

  it('usa la etiqueta plural del modelo en la KPI card, con fallback al plural', () => {
    const subs = dashboardSubstitutions(metricsOnly(models))

    expect(subs['panelSections']).toContain('title="Contratos"')
    expect(subs['panelSections']).toContain('title="projects"')
    expect(subs['panelSections']).toContain('testId="kpi-contracts"')
  })

  it('los totales del spec emitido son distintos por recurso (detectan cruces de endpoint)', () => {
    const subs = dashboardSubstitutions(metricsOnly(models))

    expect(subs['specTotals']).toContain("'/api/v1/contracts': 7")
    expect(subs['specTotals']).toContain("'/api/v1/projects': 14")
  })

  it('acota las columnas del grid entre 2 y 4', () => {
    expect(dashboardSubstitutions(metricsOnly(models.slice(0, 1)))['panelSections']).toContain('xl:grid-cols-2')
    expect(dashboardSubstitutions(metricsOnly([...models, ...models, ...models]))['panelSections']).toContain(
      'xl:grid-cols-4'
    )
  })
})

describe('widgets analíticos — composición y bindings (spec 32)', () => {
  const contract = (): ResourceDefinition =>
    ({
      schemaVersion: 1,
      name: 'contract',
      plural: 'contracts',
      context: 'crm',
      schemaName: 'crm',
      labels: { singular: 'Contrato', plural: 'Contratos' },
      fields: {
        id: { type: 'uuid', pk: true },
        contractType: {
          type: 'string',
          vo: { name: 'ContractType', fieldName: 'Type', values: ['cloud', 'onprem'] },
          query: { filterable: true },
          table: {
            show: true,
            label: 'Tipo',
            badgeMap: { cloud: { label: 'Cloud', variant: 'default' }, onprem: { label: 'On-premise', variant: 'outline' } }
          },
          form: { control: 'select', label: 'Tipo', optionsType: 'ContractTypeEnum' }
        },
        startDate: { type: 'date', query: { filterable: true } },
        notes: { type: 'string' }
      }
    }) as unknown as ResourceDefinition

  const appWith = (blocks: object[]): AppDefinition =>
    ({
      schemaVersion: 1,
      name: 'demo',
      pages: [
        { kind: 'dashboard', blocks },
        { kind: 'resource', resource: 'contract' }
      ]
    }) as AppDefinition

  const registry = () => ({ contract: contract() })

  it('composeApp resuelve los widgets analíticos con valores y etiquetas del modelo', () => {
    const composition = composeApp(
      appWith([
        { kind: 'metrics', resources: ['contract'] },
        { kind: 'count-by', resource: 'contract', field: 'contractType' },
        { kind: 'kpi-count', resource: 'contract', field: 'contractType', equals: 'cloud', label: 'Cloud activos' },
        { kind: 'series', resource: 'contract', field: 'startDate' }
      ]),
      registry()
    )

    expect(composition.dashboardBlocks.filter(b => b.kind !== 'metrics')).toHaveLength(3)
    const countBy = composition.dashboardBlocks.find(b => b.kind === 'count-by')
    expect(countBy?.values).toEqual([
      { value: 'cloud', label: 'Cloud' },
      { value: 'onprem', label: 'On-premise' }
    ])
    expect(countBy?.label).toBe('Tipo')
  })

  it('rechaza count-by sobre un campo sin valores o no filterable, y series sobre un no-fecha', () => {
    expect(() =>
      composeApp(appWith([{ kind: 'count-by', resource: 'contract', field: 'notes' }]), registry())
    ).toThrow(/notes/)
    expect(() =>
      composeApp(appWith([{ kind: 'series', resource: 'contract', field: 'contractType' }]), registry())
    ).toThrow(/date/)
    expect(() =>
      composeApp(appWith([{ kind: 'kpi-count', resource: 'contract', field: 'notes', equals: 'x', label: 'X' }]), registry())
    ).toThrow(/filterable/)
  })

  it('dashboardSubstitutions emite cargas y marcado para los tres widgets', () => {
    const composition = composeApp(
      appWith([
        { kind: 'metrics', resources: ['contract'] },
        { kind: 'count-by', resource: 'contract', field: 'contractType' },
        { kind: 'kpi-count', resource: 'contract', field: 'contractType', equals: 'cloud', label: 'Cloud activos' },
        { kind: 'series', resource: 'contract', field: 'startDate' }
      ]),
      registry()
    )

    const subs = dashboardSubstitutions(composition.dashboardBlocks)

    expect(subs['resourceEntries']).toContain("_counts('/api/v1/contracts', 'contractType'")
    expect(subs['resourceEntries']).toContain("_countWhere('/api/v1/contracts', 'contractType', 'cloud')")
    expect(subs['resourceEntries']).toContain("_series('/api/v1/contracts', 'startDate')")
    expect(subs['panelSections']).toContain('Cloud activos')
    expect(subs['panelSections']).toContain('data-testid="count-by-')
    expect(subs['panelSections']).toContain('data-testid="series-')
  })

  it('la serie recorta el día en hora LOCAL, no con toISOString', () => {
    const composition = composeApp(appWith([{ kind: 'series', resource: 'contract', field: 'startDate' }]), registry())

    const subs = dashboardSubstitutions(composition.dashboardBlocks)

    // `new Date(2026, 7, 1).toISOString()` en Madrid es '2026-07-31T22:00:00Z': el corte por
    // UTC mete las altas del día 1 en el mes anterior. El día se compone de las partes locales.
    expect(subs['analyticHelpers']).not.toContain('toISOString')
    expect(subs['analyticHelpers']).toContain('getFullYear()')
    expect(subs['analyticHelpers']).toContain('padStart(2')
  })

  it('sin bloques analíticos el panel emite exactamente lo de siempre', () => {
    const composition = composeApp(appWith([{ kind: 'metrics', resources: ['contract'] }]), registry())

    const subs = dashboardSubstitutions(composition.dashboardBlocks)

    // solo la rejilla de tarjetas: ni sección analítica ni la rejilla de dos columnas
    expect(subs['panelSections']).not.toContain('lg:grid-cols-2')
    expect(subs['panelSections']).not.toContain('data-testid="count-by-')
    expect(subs['resourceEntries']).not.toContain('_counts')
  })
})

describe('composeApp — arreglos que destapó el typecheck del oro (spec 32)', () => {
  const registryWithCustomer = () => {
    const customer = {
      schemaVersion: 1,
      name: 'customer',
      plural: 'customers',
      context: 'crm',
      schemaName: 'crm',
      fields: { id: { type: 'uuid', pk: true } }
    } as unknown as ResourceDefinition
    const contract = {
      schemaVersion: 1,
      name: 'contract',
      plural: 'contracts',
      context: 'crm',
      schemaName: 'crm',
      fields: {
        id: { type: 'uuid', pk: true },
        customerId: { type: 'uuid', relation: { to: 'customer', kind: 'reference' } }
      }
    } as unknown as ResourceDefinition
    return { customer, contract }
  }

  it('la fila de métricas no duplica tarjetas por los analíticos del mismo recurso', () => {
    const registry = registryWithCustomer()
    const app = {
      schemaVersion: 1,
      name: 'demo',
      pages: [
        {
          kind: 'dashboard',
          blocks: [
            { kind: 'metrics', resources: ['customer'] },
            { kind: 'kpi-count', resource: 'customer', field: 'id', equals: 'x', label: 'X' }
          ]
        },
        { kind: 'resource', resource: 'customer' }
      ]
    } as unknown as AppDefinition
    // id es filterable en los modelos reales; aquí basta con declararlo
    registry.customer.fields['id'].query = { filterable: true }

    const composition = composeApp(app, registry)

    expect(composition.dashboardBlocks.filter(b => b.kind === 'metrics').flatMap(b => b.models.map(m => m.name))).toEqual(['customer'])
  })

  it('un corte que referencia a un modelo fuera lo INCLUYE: sin el padre no compila ni funciona el lookup', () => {
    const registry = registryWithCustomer()
    const app = {
      schemaVersion: 1,
      name: 'demo',
      pages: [{ kind: 'resource', resource: 'contract' }]
    } as unknown as AppDefinition

    const composition = composeApp(app, registry)

    expect(composition.models.map(m => m.name)).toEqual(['contract', 'customer'])
    // el padre entra como dependencia, no como página: la nav no cambia
    expect(composition.pages).toHaveLength(1)
  })
})

describe('el panel lleva listados dentro (spec 52)', () => {
  const contract = model({
    name: 'contract',
    plural: 'contracts',
    context: 'sap-licensing',
    labels: { plural: 'Contratos' }
  } as Partial<ResourceDefinition>)

  it('composeApp resuelve las tablas del panel a modelos, en orden', () => {
    const definition: AppDefinition = {
      schemaVersion: 1,
      name: 'golden',
      pages: [
        {
          kind: 'dashboard',
          blocks: [
            { kind: 'metrics', resources: ['contract'] },
            { kind: 'table', resource: 'contract' }
          ]
        },
        { kind: 'resource', resource: 'contract' }
      ]
    }

    const composition = composeApp(definition, { contract })

    expect(composition.dashboardBlocks.map(b => b.kind)).toEqual(['metrics', 'table'])
  })

  it('una tabla del panel que no existe en el registro revienta al componer, no al compilar', () => {
    const definition: AppDefinition = {
      schemaVersion: 1,
      name: 'golden',
      pages: [
        {
          kind: 'dashboard',
          blocks: [
            { kind: 'metrics', resources: ['contract'] },
            { kind: 'table', resource: 'fantasma' }
          ]
        }
      ]
    }

    expect(() => composeApp(definition, { contract })).toThrow(/fantasma/)
  })

  it('dashboardSubstitutions emite import, selector y marcado del listado embebido', () => {
    const subs = dashboardSubstitutions([
      { kind: 'metrics', width: 'full', models: [contract] },
      { kind: 'table', width: 'full', models: [contract] }
    ])

    expect(subs['listImports']).toContain(
      "import { ContractsListComponent } from '../bounded-contexts/sap-licensing/features/contracts/contracts-list.component'"
    )
    expect(subs['listSelectors']).toBe(', ContractsListComponent')
    expect(subs['panelSections']).toContain('<app-contracts-list [embedded]="true" />')
  })

  it('un panel sin listados no emite nada de esto (el dashboard de siempre)', () => {
    const subs = dashboardSubstitutions(metricsOnly([contract]))

    expect(subs['listImports']).toBe('')
    expect(subs['listSelectors']).toBe('')
    expect(subs['panelSections']).not.toContain('-list [embedded]')
  })
})

describe('el panel es una secuencia de bloques (spec 53)', () => {
  const contract = model({ name: 'contract', plural: 'contracts', labels: { plural: 'Contratos' } } as Partial<ResourceDefinition>)
  const project = model({ name: 'project', plural: 'projects', labels: { plural: 'Proyectos' } } as Partial<ResourceDefinition>)

  const analytic = (property: string, width: 'full' | 'half'): ComposedDashboardBlock => ({
    kind: 'kpi-count',
    width,
    models: [contract],
    property,
    api: '/api/v1/contracts',
    field: 'status',
    equals: 'active',
    label: property
  })

  it('emite los bloques EN EL ORDEN dibujado, no por tipo', () => {
    const sections = dashboardSubstitutions([
      { kind: 'table', width: 'full', models: [contract] },
      { kind: 'metrics', width: 'full', models: [project] }
    ])['panelSections']

    // la tabla primero porque así está dibujada: antes el orden lo imponía la plantilla
    expect(sections.indexOf('app-contracts-list')).toBeLessThan(sections.indexOf('kpi-projects'))
  })

  it('dos bloques half seguidos comparten la rejilla de dos columnas', () => {
    const sections = dashboardSubstitutions([analytic('uno', 'half'), analytic('dos', 'half')])['panelSections']

    expect(sections.match(/grid gap-4 lg:grid-cols-2/g)).toHaveLength(1)
    expect(sections.indexOf('uno')).toBeLessThan(sections.indexOf('dos'))
  })

  it('un half suelto sale a lo ancho, esté al final o entre dos full', () => {
    const alFinal = dashboardSubstitutions([
      { kind: 'metrics', width: 'full', models: [contract] },
      analytic('solo', 'half')
    ])['panelSections']
    const enMedio = dashboardSubstitutions([
      { kind: 'metrics', width: 'full', models: [contract] },
      analytic('solo', 'half'),
      { kind: 'table', width: 'full', models: [project] }
    ])['panelSections']

    expect(alFinal).not.toContain('lg:grid-cols-2')
    expect(enMedio).not.toContain('lg:grid-cols-2')
  })

  it('un bloque full corta la tirada de half: dos rejillas, no una', () => {
    const sections = dashboardSubstitutions([
      analytic('uno', 'half'),
      analytic('dos', 'half'),
      { kind: 'table', width: 'full', models: [contract] },
      analytic('tres', 'half'),
      analytic('cuatro', 'half')
    ])['panelSections']

    expect(sections.match(/grid gap-4 lg:grid-cols-2/g)).toHaveLength(2)
  })

  it('el servicio deduplica el total de un recurso citado en dos filas de métricas', () => {
    const subs = dashboardSubstitutions([
      { kind: 'metrics', width: 'full', models: [contract] },
      { kind: 'metrics', width: 'full', models: [contract, project] }
    ])

    expect(subs['resourceEntries'].match(/readonly contracts = this\._total/g)).toHaveLength(1)
  })
})
