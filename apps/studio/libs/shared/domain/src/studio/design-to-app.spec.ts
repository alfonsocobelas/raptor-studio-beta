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
