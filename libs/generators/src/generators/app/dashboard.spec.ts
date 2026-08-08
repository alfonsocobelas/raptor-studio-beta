import type { AppDefinition, ResourceDefinition } from '@acc/schema'
import { dashboardSubstitutions } from './app'
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

describe('dashboardSubstitutions — bindings del dashboard opcional', () => {
  const models = [
    model({ name: 'contract', plural: 'contracts', labels: { plural: 'Contratos' } } as Partial<ResourceDefinition>),
    model({ name: 'project', plural: 'projects', api: '/api/v1/projects' } as Partial<ResourceDefinition>)
  ]

  it('emite una carga de total por recurso con su endpoint', () => {
    const subs = dashboardSubstitutions(models)

    expect(subs['resourceEntries']).toContain("readonly contracts = this._total('/api/v1/contracts')")
    expect(subs['resourceEntries']).toContain("readonly projects = this._total('/api/v1/projects')")
    expect(subs['loadingExpr']).toBe('this.contracts.isLoading() || this.projects.isLoading()')
  })

  it('usa la etiqueta plural del modelo en la KPI card, con fallback al plural', () => {
    const subs = dashboardSubstitutions(models)

    expect(subs['kpiCards']).toContain('title="Contratos"')
    expect(subs['kpiCards']).toContain('title="projects"')
    expect(subs['kpiCards']).toContain('testId="kpi-contracts"')
  })

  it('los totales del spec emitido son distintos por recurso (detectan cruces de endpoint)', () => {
    const subs = dashboardSubstitutions(models)

    expect(subs['specTotals']).toContain("'/api/v1/contracts': 7")
    expect(subs['specTotals']).toContain("'/api/v1/projects': 14")
  })

  it('acota las columnas del grid entre 2 y 4', () => {
    expect(dashboardSubstitutions(models.slice(0, 1))['gridCols']).toBe('2')
    expect(dashboardSubstitutions([...models, ...models, ...models])['gridCols']).toBe('4')
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

  const appWith = (widgets: object[]): AppDefinition =>
    ({
      schemaVersion: 1,
      name: 'demo',
      pages: [
        { kind: 'dashboard', widgets },
        { kind: 'resource', resource: 'contract' }
      ]
    }) as AppDefinition

  const registry = () => ({ contract: contract() })

  it('composeApp resuelve los widgets analíticos con valores y etiquetas del modelo', () => {
    const composition = composeApp(
      appWith([
        { kind: 'kpi-total', resource: 'contract' },
        { kind: 'count-by', resource: 'contract', field: 'contractType' },
        { kind: 'kpi-count', resource: 'contract', field: 'contractType', equals: 'cloud', label: 'Cloud activos' },
        { kind: 'series', resource: 'contract', field: 'startDate' }
      ]),
      registry()
    )

    expect(composition.analytics).toHaveLength(3)
    const countBy = composition.analytics?.find(w => w.kind === 'count-by')
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
        { kind: 'kpi-total', resource: 'contract' },
        { kind: 'count-by', resource: 'contract', field: 'contractType' },
        { kind: 'kpi-count', resource: 'contract', field: 'contractType', equals: 'cloud', label: 'Cloud activos' },
        { kind: 'series', resource: 'contract', field: 'startDate' }
      ]),
      registry()
    )

    const subs = dashboardSubstitutions(composition.kpiModels, composition.analytics)

    expect(subs['resourceEntries']).toContain("_counts('/api/v1/contracts', 'contractType'")
    expect(subs['resourceEntries']).toContain("_countWhere('/api/v1/contracts', 'contractType', 'cloud')")
    expect(subs['resourceEntries']).toContain("_series('/api/v1/contracts', 'startDate')")
    expect(subs['analyticSections']).toContain('Cloud activos')
    expect(subs['analyticSections']).toContain('data-testid="count-by-')
    expect(subs['analyticSections']).toContain('data-testid="series-')
  })

  it('sin widgets analíticos el dashboard emite exactamente lo de siempre', () => {
    const composition = composeApp(appWith([{ kind: 'kpi-total', resource: 'contract' }]), registry())

    const subs = dashboardSubstitutions(composition.kpiModels, composition.analytics)

    expect(subs['analyticSections']).toBe('')
    expect(subs['resourceEntries']).not.toContain('_counts')
  })
})
