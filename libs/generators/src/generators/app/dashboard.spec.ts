import type { ResourceDefinition } from '@acc/schema'
import { dashboardSubstitutions } from './app'

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
