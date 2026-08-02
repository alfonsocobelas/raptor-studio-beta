import { designPagesToAppPages } from './design-to-app'
import type { DesignPage } from './design-page'

describe('designPagesToAppPages — traducción de bloques a app-schema', () => {
  it('una vista con tabla se emite como página de recurso', () => {
    const pages: DesignPage[] = [{ title: 'Pacientes', blocks: [{ kind: 'table', resource: 'paciente' }] }]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'resource', resource: 'paciente', label: 'Pacientes' }])
  })

  it('una vista con KPIs se emite como dashboard con un widget por entidad', () => {
    const pages: DesignPage[] = [
      { title: 'Panel', blocks: [{ kind: 'kpis', resources: ['paciente', 'cita'] }] }
    ]

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        widgets: [
          { kind: 'kpi-total', resource: 'paciente' },
          { kind: 'kpi-total', resource: 'cita' }
        ]
      }
    ])
  })

  it('una vista mixta (KPIs + tabla) emite AMBAS: dashboard y listado', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [
          { kind: 'kpis', resources: ['paciente'] },
          { kind: 'table', resource: 'cita' }
        ]
      }
    ]

    // el título de la vista lo toma el dashboard; el listado cae a su propia
    // etiqueta para que el menú no muestre dos entradas llamadas «Panel»
    expect(designPagesToAppPages(pages)).toEqual([
      { kind: 'dashboard', label: 'Panel', widgets: [{ kind: 'kpi-total', resource: 'paciente' }] },
      { kind: 'resource', resource: 'cita' }
    ])
  })

  it('descarta los bloques aún no generables (galería, ficha, texto)', () => {
    const pages: DesignPage[] = [
      { title: 'Tratamientos', blocks: [{ kind: 'cards', resource: 'tratamiento' }] },
      { title: 'Ficha', blocks: [{ kind: 'fields', resource: 'paciente' }, { kind: 'text', text: 'hola' }] }
    ]

    expect(designPagesToAppPages(pages)).toEqual([])
  })

  it('no duplica el dashboard: solo la primera vista con KPIs lo produce', () => {
    const pages: DesignPage[] = [
      { title: 'Panel', blocks: [{ kind: 'kpis', resources: ['paciente'] }] },
      { title: 'Otro panel', blocks: [{ kind: 'kpis', resources: ['cita'] }] }
    ]

    const result = designPagesToAppPages(pages)

    expect(result.filter(p => p.kind === 'dashboard')).toHaveLength(1)
  })

  it('no repite una entidad en dos listados: el app-schema exige unicidad', () => {
    const pages: DesignPage[] = [
      { title: 'Citas de hoy', blocks: [{ kind: 'table', resource: 'cita' }] },
      { title: 'Todas las citas', blocks: [{ kind: 'table', resource: 'cita' }] }
    ]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'resource', resource: 'cita', label: 'Citas de hoy' }])
  })
})
