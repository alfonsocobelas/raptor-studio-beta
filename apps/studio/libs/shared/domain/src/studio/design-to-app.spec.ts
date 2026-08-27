import { designPagesToAppPages } from './design-to-app'
import type { DesignPage } from './design-page'

describe('designPagesToAppPages — traducción de bloques a app-schema', () => {
  it('una vista con tabla se emite como página de recurso', () => {
    const pages: DesignPage[] = [{ title: 'Pacientes', blocks: [{ kind: 'table', resource: 'paciente' }] }]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'resource', resource: 'paciente', label: 'Pacientes' }])
  })

  it('una vista con KPIs se emite como dashboard con un widget por entidad', () => {
    const pages: DesignPage[] = [{ title: 'Panel', blocks: [{ kind: 'kpis', resources: ['paciente', 'cita'] }] }]

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        blocks: [{ kind: 'metrics', resources: ['paciente', 'cita'], width: 'full' }]
      }
    ])
  })

  // spec 52: un panel es métricas arriba y el listado debajo. Antes la tabla de la vista del
  // panel salía como pantalla APARTE — el panel quedaba sin tabla y el lienzo mentía.
  it('una vista mixta (KPIs + tabla) emite UN panel que lleva ese listado dentro', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [
          { kind: 'kpis', resources: ['paciente'] },
          { kind: 'table', resource: 'cita' }
        ]
      }
    ]

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        blocks: [
          { kind: 'metrics', resources: ['paciente'], width: 'full' },
          { kind: 'table', resource: 'cita', width: 'full' }
        ]
      }
    ])
  })

  it('el panel respeta el ancho dibujado de sus bloques (spec 53)', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [
          { kind: 'kpis', resources: ['paciente'], width: 'half' },
          { kind: 'table', resource: 'cita', width: 'half' }
        ]
      }
    ]

    expect(designPagesToAppPages(pages)[0]).toEqual({
      kind: 'dashboard',
      label: 'Panel',
      blocks: [
        { kind: 'metrics', resources: ['paciente'], width: 'half' },
        { kind: 'table', resource: 'cita', width: 'half' }
      ]
    })
  })

  it('la tabla dibujada ANTES de los KPIs sale antes en el panel: el orden es el del dibujo', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [
          { kind: 'table', resource: 'cita' },
          { kind: 'kpis', resources: ['paciente'] }
        ]
      }
    ]

    expect(designPagesToAppPages(pages)[0]).toMatchObject({
      blocks: [
        { kind: 'table', resource: 'cita' },
        { kind: 'metrics', resources: ['paciente'] }
      ]
    })
  })

  it('la tabla del panel NO le roba la pantalla ni el título a su propia vista (demo taller)', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [
          { kind: 'kpis', resources: ['orden'] },
          { kind: 'table', resource: 'orden' }
        ]
      },
      { title: 'Órdenes', blocks: [{ kind: 'table', resource: 'orden' }] }
    ]

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        blocks: [
          { kind: 'metrics', resources: ['orden'], width: 'full' },
          { kind: 'table', resource: 'orden', width: 'full' }
        ]
      },
      { kind: 'resource', resource: 'orden', label: 'Órdenes' }
    ])
  })

  it('dos tablas del mismo recurso en el MISMO panel colapsan en una', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [
          { kind: 'kpis', resources: ['orden'] },
          { kind: 'table', resource: 'orden' },
          { kind: 'table', resource: 'orden' }
        ]
      }
    ]

    expect(designPagesToAppPages(pages)[0]).toMatchObject({
      blocks: [
        { kind: 'metrics', resources: ['orden'], width: 'full' },
        { kind: 'table', resource: 'orden', width: 'full' }
      ]
    })
  })

  it('una vista de galería se emite como página de tarjetas', () => {
    const pages: DesignPage[] = [{ title: 'Tratamientos', blocks: [{ kind: 'cards', resource: 'tratamiento' }] }]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'cards', resource: 'tratamiento', label: 'Tratamientos' }])
  })

  // spec 48: el bloque formulario cruza como página form
  it('una vista con formulario se emite como página form', () => {
    const pages: DesignPage[] = [{ title: 'Solicitud', blocks: [{ kind: 'form', resource: 'muestra' }] }]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'form', resource: 'muestra', label: 'Solicitud' }])
  })

  it('no repite la página form de una entidad aunque el bloque aparezca dos veces', () => {
    const pages: DesignPage[] = [
      { title: 'Solicitud', blocks: [{ kind: 'form', resource: 'muestra' }] },
      { title: 'Otra', blocks: [{ kind: 'form', resource: 'muestra' }] }
    ]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'form', resource: 'muestra', label: 'Solicitud' }])
  })

  it('una vista mixta (tabla + formulario) emite ambas páginas y el título nombra solo la primera', () => {
    const pages: DesignPage[] = [
      {
        title: 'Muestras',
        blocks: [
          { kind: 'table', resource: 'muestra' },
          { kind: 'form', resource: 'muestra' }
        ]
      }
    ]

    expect(designPagesToAppPages(pages)).toEqual([
      { kind: 'resource', resource: 'muestra', label: 'Muestras' },
      { kind: 'form', resource: 'muestra' }
    ])
  })

  it('descarta los bloques aún no generables (texto)', () => {
    const pages: DesignPage[] = [{ title: 'Notas', blocks: [{ kind: 'text', text: 'hola' }] }]

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

// spec 59: el bloque calendario cruza como página calendar
describe('designPagesToAppPages — calendario (spec 59)', () => {
  it('una vista con calendario se emite como página calendar', () => {
    const pages: DesignPage[] = [{ title: 'Entregas', blocks: [{ kind: 'calendar', resource: 'pedido', dateField: 'entrega' }] }]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'calendar', resource: 'pedido', label: 'Entregas' }])
  })

  it('no repite la página calendar de una entidad aunque el bloque aparezca dos veces', () => {
    const pages: DesignPage[] = [
      { title: 'Entregas', blocks: [{ kind: 'calendar', resource: 'pedido', dateField: 'entrega' }] },
      { title: 'Otra', blocks: [{ kind: 'calendar', resource: 'pedido', dateField: 'entrega' }] }
    ]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'calendar', resource: 'pedido', label: 'Entregas' }])
  })
})

// spec 59: un calendario sin campo fecha es diseño y nada más
it('un calendario sin campo fecha no cruza al app-schema', () => {
  const pages: DesignPage[] = [{ title: 'Entregas', blocks: [{ kind: 'calendar', resource: 'pedido' }] }]

  expect(designPagesToAppPages(pages)).toEqual([])
})

// spec 61: el bloque kanban cruza como página kanban
describe('designPagesToAppPages — kanban (spec 61)', () => {
  it('una vista con kanban se emite como página kanban', () => {
    const pages: DesignPage[] = [{ title: 'Tablero', blocks: [{ kind: 'kanban', resource: 'pedido', columnsField: 'estado' }] }]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'kanban', resource: 'pedido', label: 'Tablero' }])
  })

  it('un kanban sin campo de columnas no cruza al app-schema', () => {
    const pages: DesignPage[] = [{ title: 'Tablero', blocks: [{ kind: 'kanban', resource: 'pedido' }] }]

    expect(designPagesToAppPages(pages)).toEqual([])
  })
})

describe('designPagesToAppPages — tarjeta KPI y top-n (spec 70)', () => {
  const panel = (blocks: DesignPage['blocks']): DesignPage[] => [{ title: 'Panel', blocks }]

  it('una vista con SOLO una tarjeta KPI ya abre el panel', () => {
    const pages = panel([{ kind: 'kpi', resource: 'pedido', kpiLabel: 'Pendientes' }])

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        blocks: [{ kind: 'kpi', resource: 'pedido', label: 'Pendientes', measure: 'count', width: 'full' }]
      }
    ])
  })

  it('ensambla la condición y la ventana desde los campos planos', () => {
    const pages = panel([
      {
        kind: 'kpi',
        resource: 'pedido',
        kpiLabel: 'Pendientes este mes',
        kpiConditionField: 'estado',
        kpiConditionOperator: 'eq',
        kpiConditionValue: 'pendiente',
        kpiWindowField: 'creado',
        kpiWindowPreset: 'month',
        kpiCompare: true,
        width: 'half'
      }
    ])

    expect(designPagesToAppPages(pages)[0]).toMatchObject({
      blocks: [
        {
          kind: 'kpi',
          condition: { field: 'estado', operator: 'eq', value: 'pendiente' },
          window: { field: 'creado', preset: 'month' },
          compare: true,
          width: 'half'
        }
      ]
    })
  })

  it('sin etiqueta usa el plural de la entidad: el app-schema la exige', () => {
    const pages = panel([{ kind: 'kpi', resource: 'pedido' }])

    expect(designPagesToAppPages(pages, () => 'Pedidos')[0]).toMatchObject({
      blocks: [{ label: 'Pedidos' }]
    })
  })

  it('una comparación sin ventana no cruza: no hay periodo anterior de «siempre»', () => {
    const pages = panel([{ kind: 'kpi', resource: 'pedido', kpiLabel: 'X', kpiCompare: true }])

    const [panelPage] = designPagesToAppPages(pages)
    expect(panelPage.kind === 'dashboard' && panelPage.blocks[0]).not.toHaveProperty('compare')
  })

  it('una ventana sin campo fecha no cruza: no acotaría nada', () => {
    const pages = panel([{ kind: 'kpi', resource: 'pedido', kpiLabel: 'X', kpiWindowPreset: 'month' }])

    const [panelPage] = designPagesToAppPages(pages)
    expect(panelPage.kind === 'dashboard' && panelPage.blocks[0]).not.toHaveProperty('window')
  })

  it('el preset de N días arrastra su longitud, con 30 por defecto', () => {
    const pages = panel([
      { kind: 'kpi', resource: 'pedido', kpiLabel: 'X', kpiWindowField: 'creado', kpiWindowPreset: 'days' }
    ])

    expect(designPagesToAppPages(pages)[0]).toMatchObject({
      blocks: [{ window: { field: 'creado', preset: 'days', days: 30 } }]
    })
  })

  it('el top-n cruza con su campo de orden, y sin él no cruza nada', () => {
    const withField = panel([{ kind: 'top-n', resource: 'pedido', topField: 'importe', topN: 3 }])
    expect(designPagesToAppPages(withField)[0]).toMatchObject({
      blocks: [{ kind: 'top-n', resource: 'pedido', field: 'importe', n: 3, dir: 'desc' }]
    })

    const withoutField = panel([{ kind: 'top-n', resource: 'pedido' }])
    expect(designPagesToAppPages(withoutField)).toEqual([])
  })
})
