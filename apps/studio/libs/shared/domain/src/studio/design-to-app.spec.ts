import { designPagesToAppPages } from './design-to-app'
import type { DesignPage, KpiCell } from './design-page'

/** Fila de KPIs con celdas: el ÚNICO formato analítico del diseño desde la spec 73. */
const row = (items: KpiCell[], width?: 'full' | 'half'): DesignPage['blocks'][number] => ({
  kind: 'kpis',
  items,
  ...(width ? { width } : {})
})

const counters = (...resources: string[]): KpiCell[] => resources.map(resource => ({ kind: 'counter', resource }))

describe('designPagesToAppPages — traducción de bloques a app-schema', () => {
  it('una vista con tabla se emite como página de recurso', () => {
    const pages: DesignPage[] = [{ title: 'Pacientes', blocks: [{ kind: 'table', resource: 'paciente' }] }]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'resource', resource: 'paciente', label: 'Pacientes' }])
  })

  it('una vista con KPIs se emite como dashboard con la fila y sus celdas', () => {
    const pages: DesignPage[] = [{ title: 'Panel', blocks: [row(counters('paciente', 'cita'))] }]

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        blocks: [
          {
            kind: 'kpi-row',
            cells: [
              { kind: 'counter', resource: 'paciente' },
              { kind: 'counter', resource: 'cita' }
            ],
            width: 'full'
          }
        ]
      }
    ])
  })

  // spec 52: un panel es métricas arriba y el listado debajo. Antes la tabla de la vista del
  // panel salía como pantalla APARTE — el panel quedaba sin tabla y el lienzo mentía.
  it('una vista mixta (KPIs + tabla) emite UN panel que lleva ese listado dentro', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [row(counters('paciente')), { kind: 'table', resource: 'cita' }]
      }
    ]

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        blocks: [
          { kind: 'kpi-row', cells: [{ kind: 'counter', resource: 'paciente' }], width: 'full' },
          { kind: 'table', resource: 'cita', width: 'full' }
        ]
      }
    ])
  })

  it('el panel respeta el ancho dibujado de sus bloques (spec 53)', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [row(counters('paciente'), 'half'), { kind: 'table', resource: 'cita', width: 'half' }]
      }
    ]

    expect(designPagesToAppPages(pages)[0]).toEqual({
      kind: 'dashboard',
      label: 'Panel',
      blocks: [
        { kind: 'kpi-row', cells: [{ kind: 'counter', resource: 'paciente' }], width: 'half' },
        { kind: 'table', resource: 'cita', width: 'half' }
      ]
    })
  })

  it('la tabla dibujada ANTES de los KPIs sale antes en el panel: el orden es el del dibujo', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [{ kind: 'table', resource: 'cita' }, row(counters('paciente'))]
      }
    ]

    expect(designPagesToAppPages(pages)[0]).toMatchObject({
      blocks: [{ kind: 'table', resource: 'cita' }, { kind: 'kpi-row' }]
    })
  })

  it('la tabla del panel NO le roba la pantalla ni el título a su propia vista (demo taller)', () => {
    const pages: DesignPage[] = [
      {
        title: 'Panel',
        blocks: [row(counters('orden')), { kind: 'table', resource: 'orden' }]
      },
      { title: 'Órdenes', blocks: [{ kind: 'table', resource: 'orden' }] }
    ]

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        blocks: [
          { kind: 'kpi-row', cells: [{ kind: 'counter', resource: 'orden' }], width: 'full' },
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
        blocks: [row(counters('orden')), { kind: 'table', resource: 'orden' }, { kind: 'table', resource: 'orden' }]
      }
    ]

    expect(designPagesToAppPages(pages)[0]).toMatchObject({
      blocks: [{ kind: 'kpi-row' }, { kind: 'table', resource: 'orden', width: 'full' }]
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

  it('una fila sin celdas emitibles no cruza: ni fila vacía ni panel', () => {
    const pages: DesignPage[] = [{ title: 'Panel', blocks: [row([])] }]

    expect(designPagesToAppPages(pages)).toEqual([])
  })

  it('no duplica el dashboard: solo la primera vista con KPIs lo produce', () => {
    const pages: DesignPage[] = [
      { title: 'Panel', blocks: [row(counters('paciente'))] },
      { title: 'Otro panel', blocks: [row(counters('cita'))] }
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
    const pages: DesignPage[] = [
      { title: 'Entregas', blocks: [{ kind: 'calendar', resource: 'pedido', dateField: 'entrega' }] }
    ]

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
    const pages: DesignPage[] = [
      { title: 'Tablero', blocks: [{ kind: 'kanban', resource: 'pedido', columnsField: 'estado' }] }
    ]

    expect(designPagesToAppPages(pages)).toEqual([{ kind: 'kanban', resource: 'pedido', label: 'Tablero' }])
  })

  it('un kanban sin campo de columnas no cruza al app-schema', () => {
    const pages: DesignPage[] = [{ title: 'Tablero', blocks: [{ kind: 'kanban', resource: 'pedido' }] }]

    expect(designPagesToAppPages(pages)).toEqual([])
  })
})

describe('designPagesToAppPages — celdas KPI y top-n (specs 70 y 73)', () => {
  const panel = (items: KpiCell[]): DesignPage[] => [{ title: 'Panel', blocks: [row(items)] }]
  const cellsOf = (pages: ReturnType<typeof designPagesToAppPages>) => {
    const [page] = pages
    const block = page?.kind === 'dashboard' ? page.blocks[0] : undefined
    return block?.kind === 'kpi-row' ? block.cells : []
  }

  it('una vista con SOLO una celda KPI ya abre el panel', () => {
    const pages = panel([{ kind: 'kpi', resource: 'pedido', kpiLabel: 'Pendientes' }])

    expect(designPagesToAppPages(pages)).toEqual([
      {
        kind: 'dashboard',
        label: 'Panel',
        blocks: [
          {
            kind: 'kpi-row',
            cells: [{ kind: 'kpi', resource: 'pedido', label: 'Pendientes', measure: 'count' }],
            width: 'full'
          }
        ]
      }
    ])
  })

  it('una fila mixta cruza sus celdas EN ORDEN: contador, kpi y top-n en la misma línea', () => {
    const pages = panel([
      { kind: 'counter', resource: 'pedido' },
      { kind: 'kpi', resource: 'pedido', kpiLabel: 'Pendientes' },
      { kind: 'top-n', resource: 'pedido', topField: 'importe', topN: 3 }
    ])

    expect(cellsOf(designPagesToAppPages(pages)).map(cell => cell.kind)).toEqual(['counter', 'kpi', 'top-n'])
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
        kpiCompare: true
      }
    ])

    expect(cellsOf(designPagesToAppPages(pages))[0]).toMatchObject({
      kind: 'kpi',
      condition: { field: 'estado', operator: 'eq', value: 'pendiente' },
      window: { field: 'creado', preset: 'month' },
      compare: true
    })
  })

  it('sin etiqueta usa el plural de la entidad: el app-schema la exige', () => {
    const pages = panel([{ kind: 'kpi', resource: 'pedido' }])

    expect(cellsOf(designPagesToAppPages(pages, () => 'Pedidos'))[0]).toMatchObject({ label: 'Pedidos' })
  })

  it('una comparación sin ventana no cruza: no hay periodo anterior de «siempre»', () => {
    const pages = panel([{ kind: 'kpi', resource: 'pedido', kpiLabel: 'X', kpiCompare: true }])

    expect(cellsOf(designPagesToAppPages(pages))[0]).not.toHaveProperty('compare')
  })

  it('una ventana sin campo fecha no cruza: no acotaría nada', () => {
    const pages = panel([{ kind: 'kpi', resource: 'pedido', kpiLabel: 'X', kpiWindowPreset: 'month' }])

    expect(cellsOf(designPagesToAppPages(pages))[0]).not.toHaveProperty('window')
  })

  it('el preset de N días arrastra su longitud, con 30 por defecto', () => {
    const pages = panel([
      { kind: 'kpi', resource: 'pedido', kpiLabel: 'X', kpiWindowField: 'creado', kpiWindowPreset: 'days' }
    ])

    expect(cellsOf(designPagesToAppPages(pages))[0]).toMatchObject({
      window: { field: 'creado', preset: 'days', days: 30 }
    })
  })

  it('el top-n cruza con su campo de orden, y sin él no cruza nada', () => {
    const withField = panel([{ kind: 'top-n', resource: 'pedido', topField: 'importe', topN: 3 }])
    expect(cellsOf(designPagesToAppPages(withField))[0]).toMatchObject({
      kind: 'top-n',
      resource: 'pedido',
      field: 'importe',
      n: 3,
      dir: 'desc'
    })

    const withoutField = panel([{ kind: 'top-n', resource: 'pedido' }])
    expect(designPagesToAppPages(withoutField)).toEqual([])
  })

  it('la celda incompleta se queda fuera pero el RESTO de la fila cruza', () => {
    const pages = panel([
      { kind: 'counter', resource: 'pedido' },
      { kind: 'top-n', resource: 'pedido' }
    ])

    expect(cellsOf(designPagesToAppPages(pages))).toEqual([{ kind: 'counter', resource: 'pedido' }])
  })
})

describe('designPagesToAppPages — medidas del KPI (spec 71)', () => {
  const panel = (items: KpiCell[]): DesignPage[] => [{ title: 'Panel', blocks: [row(items)] }]
  const cellOf = (pages: ReturnType<typeof designPagesToAppPages>) => {
    const [page] = pages
    const block = page?.kind === 'dashboard' ? page.blocks[0] : undefined
    return block?.kind === 'kpi-row' ? block.cells[0] : undefined
  }

  it('cruza la medida con su campo', () => {
    const pages = panel([
      { kind: 'kpi', resource: 'factura', kpiLabel: 'Facturado', kpiMeasure: 'sum', kpiField: 'importe' }
    ])

    expect(cellOf(designPagesToAppPages(pages))).toMatchObject({ measure: 'sum', field: 'importe' })
  })

  it('una medida SIN campo no cruza: falsearla como conteo pondría un número de negocio falso', () => {
    const pages = panel([{ kind: 'kpi', resource: 'factura', kpiLabel: 'Importe medio', kpiMeasure: 'sum' }])

    // ni la celda ni un panel vacío: la vista entera no abre dashboard con solo esta tarjeta
    expect(designPagesToAppPages(pages)).toEqual([])
  })

  it('el porcentaje no cruza sin condición: sería un 100% perpetuo', () => {
    const pages = panel([{ kind: 'kpi', resource: 'factura', kpiLabel: 'X', kpiRatio: true }])

    expect(cellOf(designPagesToAppPages(pages))).not.toHaveProperty('ratio')
  })

  it('el porcentaje no cruza con una medida distinta de conteo', () => {
    const pages = panel([
      {
        kind: 'kpi',
        resource: 'factura',
        kpiLabel: 'X',
        kpiMeasure: 'avg',
        kpiField: 'importe',
        kpiRatio: true
      }
    ])

    expect(cellOf(designPagesToAppPages(pages))).not.toHaveProperty('ratio')
  })
})

describe('designPagesToAppPages — barras y evolución (spec 72)', () => {
  const panel = (items: KpiCell[]): DesignPage[] => [{ title: 'Panel', blocks: [row(items)] }]
  const cellsOf = (pages: ReturnType<typeof designPagesToAppPages>) => {
    const [page] = pages
    const block = page?.kind === 'dashboard' ? page.blocks[0] : undefined
    return block?.kind === 'kpi-row' ? block.cells : []
  }

  it('las barras cruzan con su eje', () => {
    const pages = panel([{ kind: 'count-by', resource: 'pedido', axisField: 'estado' }])

    expect(cellsOf(designPagesToAppPages(pages))[0]).toMatchObject({
      kind: 'count-by',
      resource: 'pedido',
      field: 'estado'
    })
  })

  it('con medida cruzan la medida y su campo', () => {
    const pages = panel([
      { kind: 'series', resource: 'pedido', axisField: 'creado', measure: 'sum', measureField: 'importe' }
    ])

    expect(cellsOf(designPagesToAppPages(pages))[0]).toMatchObject({
      kind: 'series',
      measure: 'sum',
      measureField: 'importe'
    })
  })

  it('sin eje no cruzan: el generador no sabría emitirlas', () => {
    const pages = panel([{ kind: 'count-by', resource: 'pedido' }])

    expect(designPagesToAppPages(pages)).toEqual([])
  })

  it('una medida sin campo se degrada a conteo', () => {
    const pages = panel([{ kind: 'count-by', resource: 'pedido', axisField: 'estado', measure: 'sum' }])

    expect(cellsOf(designPagesToAppPages(pages))[0]).not.toHaveProperty('measure')
  })

  it('el sparkline del KPI cruza solo con ventana', () => {
    const withWindow = panel([
      {
        kind: 'kpi',
        resource: 'pedido',
        kpiLabel: 'X',
        kpiWindowField: 'creado',
        kpiWindowPreset: 'month',
        kpiSparkline: true
      }
    ])
    expect(cellsOf(designPagesToAppPages(withWindow))[0]).toMatchObject({ sparkline: true })

    const without = panel([{ kind: 'kpi', resource: 'pedido', kpiLabel: 'X', kpiSparkline: true }])
    expect(cellsOf(designPagesToAppPages(without))[0]).not.toHaveProperty('sparkline')
  })
})
