import { defineApp } from './define-app'
import { THEME_IDS, THEMES } from './themes'
import { AppDefinition, GENERABLE_PAGE_KINDS } from './app-types'
import { SchemaValidationError } from './validation-errors'

const validDefinition = (): AppDefinition => ({
  schemaVersion: 1,
  name: 'demo',
  pages: [
    {
      kind: 'dashboard',
      widgets: [
        { kind: 'kpi-total', resource: 'customer' },
        { kind: 'kpi-total', resource: 'contract' }
      ]
    },
    { kind: 'resource', resource: 'customer' },
    { kind: 'resource', resource: 'contract', label: 'Contratos' }
  ]
})

const problemsOf = (definition: AppDefinition): string[] => {
  try {
    defineApp(definition)
    return []
  } catch (e) {
    if (e instanceof SchemaValidationError) return e.problems
    throw e
  }
}

describe('widgets analíticos — conteos con forma (spec 32)', () => {
  const withWidgets = (widgets: object[]): AppDefinition =>
    ({
      ...validDefinition(),
      pages: [{ kind: 'dashboard', widgets }, { kind: 'resource', resource: 'contract' }]
    }) as AppDefinition

  it('acepta count-by, kpi-count y series bien formados', () => {
    const app = defineApp(
      withWidgets([
        { kind: 'kpi-total', resource: 'contract' },
        { kind: 'count-by', resource: 'contract', field: 'contractType' },
        { kind: 'kpi-count', resource: 'contract', field: 'status', equals: 'active', label: 'Activos' },
        { kind: 'series', resource: 'contract', field: 'startDate' }
      ])
    )

    expect(app.pages[0].kind).toBe('dashboard')
  })

  it('rechaza count-by/series sin field y kpi-count sin equals o sin label', () => {
    expect(problemsOf(withWidgets([{ kind: 'count-by', resource: 'contract' }]))).toContainEqual(
      expect.stringContaining('field')
    )
    expect(problemsOf(withWidgets([{ kind: 'series', resource: 'contract' }]))).toContainEqual(
      expect.stringContaining('field')
    )
    expect(
      problemsOf(withWidgets([{ kind: 'kpi-count', resource: 'contract', field: 'status', label: 'X' }]))
    ).toContainEqual(expect.stringContaining('equals'))
    expect(
      problemsOf(withWidgets([{ kind: 'kpi-count', resource: 'contract', field: 'status', equals: 'active' }]))
    ).toContainEqual(expect.stringContaining('label'))
  })

  it('el mismo recurso admite varios widgets; el duplicado exacto no', () => {
    expect(
      problemsOf(
        withWidgets([
          { kind: 'kpi-total', resource: 'contract' },
          { kind: 'count-by', resource: 'contract', field: 'contractType' }
        ])
      )
    ).toEqual([])

    expect(
      problemsOf(
        withWidgets([
          { kind: 'count-by', resource: 'contract', field: 'contractType' },
          { kind: 'count-by', resource: 'contract', field: 'contractType' }
        ])
      )
    ).toContainEqual(expect.stringContaining('duplicated'))
  })
})

describe('defineApp', () => {
  describe('valid definition', () => {
    it('returns the definition untouched and frozen', () => {
      const definition = validDefinition()

      const result = defineApp(definition)

      expect(result).toBe(definition)
      expect(Object.isFrozen(result)).toBe(true)
    })

    it('accepts an app without dashboard', () => {
      const definition = validDefinition()
      definition.pages = [{ kind: 'resource', resource: 'customer' }]

      expect(problemsOf(definition)).toEqual([])
    })

    // spec 48: la página-formulario (alta y edición en página) es un kind de pleno derecho
    it('accepts a form page and marks it as generable', () => {
      const definition = validDefinition()
      definition.pages = [
        { kind: 'resource', resource: 'customer' },
        { kind: 'form', resource: 'customer', label: 'Solicitud' }
      ]

      expect(problemsOf(definition)).toEqual([])
    })

    it('declares the form page as generable', () => {
      expect(GENERABLE_PAGE_KINDS).toContain('form')
    })

    it('rejects duplicated form pages for the same resource', () => {
      const definition = validDefinition()
      definition.pages = [
        { kind: 'form', resource: 'customer' },
        { kind: 'form', resource: 'customer' }
      ]

      expect(problemsOf(definition)).not.toEqual([])
    })
  })

  describe('identity', () => {
    it('rejects a schemaVersion other than 1', () => {
      const definition = { ...validDefinition(), schemaVersion: 2 as unknown as 1 }

      expect(problemsOf(definition)).toContain('schemaVersion: must be 1')
    })

    it('rejects a non-kebab-case name', () => {
      const definition = { ...validDefinition(), name: 'Demo App' }

      expect(problemsOf(definition)).toContain('name: must be non-empty kebab-case')
    })
  })

  describe('pages', () => {
    it('rejects an app without pages', () => {
      const definition = { ...validDefinition(), pages: [] }

      expect(problemsOf(definition)).toContain('pages: at least one page is required')
    })

    it('rejects more than one dashboard page', () => {
      const definition = validDefinition()
      definition.pages = [
        { kind: 'dashboard', widgets: [{ kind: 'kpi-total', resource: 'customer' }] },
        { kind: 'dashboard', widgets: [{ kind: 'kpi-total', resource: 'contract' }] }
      ]

      expect(problemsOf(definition)).toContain('pages: at most one dashboard page is allowed (found 2)')
    })

    it('rejects duplicated resource pages', () => {
      const definition = validDefinition()
      definition.pages = [
        { kind: 'resource', resource: 'customer' },
        { kind: 'resource', resource: 'customer' }
      ]

      expect(problemsOf(definition)).toContain("pages: duplicated resource page 'customer'")
    })

    it('rejects a non-kebab-case page resource', () => {
      const definition = validDefinition()
      definition.pages = [{ kind: 'resource', resource: 'Customer' }]

      expect(problemsOf(definition)).toContain('pages[0]: resource must be non-empty kebab-case')
    })
  })

  describe('dashboard widgets', () => {
    it('rejects a dashboard without widgets', () => {
      const definition = validDefinition()
      definition.pages = [
        { kind: 'dashboard', widgets: [] },
        { kind: 'resource', resource: 'customer' }
      ]

      expect(problemsOf(definition)).toContain('pages[0]: dashboard requires at least one widget')
    })

    it('rejects duplicated widget resources', () => {
      const definition = validDefinition()
      definition.pages = [
        {
          kind: 'dashboard',
          widgets: [
            { kind: 'kpi-total', resource: 'customer' },
            { kind: 'kpi-total', resource: 'customer' }
          ]
        }
      ]

      expect(problemsOf(definition)).toContain("pages[0]: duplicated widget 'kpi-total:customer:'")
    })

    it('rejects a non-kebab-case widget resource', () => {
      const definition = validDefinition()
      definition.pages = [{ kind: 'dashboard', widgets: [{ kind: 'kpi-total', resource: 'Customer' }] }]

      expect(problemsOf(definition)).toContain('pages[0].widgets[0]: resource must be non-empty kebab-case')
    })
  })

  it('aggregates every problem in a single error', () => {
    const definition: AppDefinition = { schemaVersion: 1, name: 'Bad Name', pages: [] }

    expect(problemsOf(definition)).toEqual([
      'name: must be non-empty kebab-case',
      'pages: at least one page is required'
    ])
  })
})

describe('theme — tema de la app (spec 20)', () => {
  const app = (theme?: { id?: string; palette?: string }): AppDefinition =>
    ({
      schemaVersion: 1,
      name: 'clinica',
      pages: [{ kind: 'resource', resource: 'paciente' }],
      ...(theme ? { theme } : {})
    }) as AppDefinition

  it('acepta un tema del catálogo', () => {
    expect(defineApp(app({ id: 'ocean' })).theme?.id).toBe('ocean')
  })

  it('sigue aceptando el alias palette de la spec 18: no invalida lo ya generado', () => {
    expect(defineApp(app({ palette: 'ocean' })).theme?.palette).toBe('ocean')
  })

  it('sin tema declarado, la app es neutra (lo que se emite hoy)', () => {
    expect(defineApp(app()).theme).toBeUndefined()
  })

  it('rechaza un tema fuera del catálogo: el lienzo no es un editor de temas', () => {
    expect(() => defineApp(app({ id: 'fucsia-flúor' }))).toThrow(/theme\.id/i)
  })

  it('rechaza también un alias fuera del catálogo', () => {
    expect(() => defineApp(app({ palette: 'fucsia-flúor' }))).toThrow(/theme\.id/i)
  })

  it('enumera los temas disponibles al rechazar', () => {
    expect(() => defineApp(app({ id: 'fucsia-flúor' }))).toThrow(new RegExp(THEME_IDS.join(', ')))
  })

  it('neutral es el primer tema: es el defecto y coincide con lo emitido hoy', () => {
    expect(THEMES[0].id).toBe('neutral')
  })
})

/**
 * Spec 22: el brief de negocio viaja con el diseño y se reenvía en cada turno del chat — sin topes,
 * degrada el prompt con el uso. Los topes son los del brainstorming 2026-08-03.
 */
describe('brief — el contexto de negocio de la app (spec 22)', () => {
  const withBrief = (brief: unknown): AppDefinition => ({ ...validDefinition(), brief }) as unknown as AppDefinition

  it('acepta un brief completo válido', () => {
    const definition = withBrief({
      business: 'Inmobiliaria de costa: capta propiedades y agenda visitas.',
      rules: ['Una visita nunca se solapa con otra del mismo agente'],
      glossary: [{ term: 'ficha', means: 'el historial completo de la propiedad' }]
    })

    expect(() => defineApp(definition)).not.toThrow()
  })

  it('acepta un brief con solo el negocio', () => {
    expect(() => defineApp(withBrief({ business: 'Taller de motos.' }))).not.toThrow()
  })

  it('rechaza business vacío o en blanco', () => {
    expect(problemsOf(withBrief({ business: '' }))).toContain('brief.business: must be a non-empty string')
    expect(problemsOf(withBrief({ business: '   ' }))).toContain('brief.business: must be a non-empty string')
  })

  it('corta business por el tope (1200)', () => {
    expect(problemsOf(withBrief({ business: 'x'.repeat(1201) }))).toContain('brief.business: exceeds 1200 characters')
    expect(() => defineApp(withBrief({ business: 'x'.repeat(1200) }))).not.toThrow()
  })

  it('corta rules por cantidad (20) y por longitud (240)', () => {
    const many = withBrief({ business: 'ok', rules: Array.from({ length: 21 }, () => 'r') })
    expect(problemsOf(many)).toContain('brief.rules: at most 20 rules')

    const long = withBrief({ business: 'ok', rules: ['x'.repeat(241)] })
    expect(problemsOf(long)).toContain('brief.rules[0]: exceeds 240 characters')
  })

  it('corta glossary por entradas (30) y term por longitud (40)', () => {
    const many = withBrief({
      business: 'ok',
      glossary: Array.from({ length: 31 }, (_, i) => ({ term: `t${i}`, means: 'm' }))
    })
    expect(problemsOf(many)).toContain('brief.glossary: at most 30 entries')

    const long = withBrief({ business: 'ok', glossary: [{ term: 'x'.repeat(41), means: 'm' }] })
    expect(problemsOf(long)).toContain('brief.glossary[0].term: exceeds 40 characters')
  })

  it('una regla o un término vacíos también son problema', () => {
    expect(problemsOf(withBrief({ business: 'ok', rules: [' '] }))).toContain(
      'brief.rules[0]: must be a non-empty string'
    )
    expect(problemsOf(withBrief({ business: 'ok', glossary: [{ term: '', means: 'm' }] }))).toContain(
      'brief.glossary[0].term: must be a non-empty string'
    )
    expect(problemsOf(withBrief({ business: 'ok', glossary: [{ term: 't', means: ' ' }] }))).toContain(
      'brief.glossary[0].means: must be a non-empty string'
    )
  })
})

/** Fase 4 (spec 20): el color de marca deriva un tema completo; catálogo y semilla no se mezclan. */
describe('theme.seed — el tema del color de marca (spec 20, fase 4)', () => {
  const app = (theme: Record<string, string>): AppDefinition => ({ ...validDefinition(), theme })

  it('acepta un hex de marca', () => {
    expect(() => defineApp(app({ seed: '#1a6dff' }))).not.toThrow()
  })

  it('rechaza lo que no es un hex', () => {
    expect(problemsOf(app({ seed: 'azulito' }))).toContain("theme.seed: 'azulito' is not a hex colour (#RRGGBB)")
  })

  it('semilla y catálogo a la vez es ambigüedad, no flexibilidad', () => {
    expect(problemsOf(app({ seed: '#1a6dff', id: 'hydrangea' }))).toContain(
      'theme.seed: mutually exclusive with theme.id/palette'
    )
  })
})
