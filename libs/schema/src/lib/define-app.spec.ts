import { defineApp } from './define-app'
import { PALETTES } from './palettes'
import { AppDefinition } from './app-types'
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
      definition.pages = [{ kind: 'dashboard', widgets: [] }, { kind: 'resource', resource: 'customer' }]

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

      expect(problemsOf(definition)).toContain("pages[0]: duplicated widget for resource 'customer'")
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

describe('theme — paleta de la app (spec 18)', () => {
  const app = (theme?: { palette: string }): AppDefinition =>
    ({
      schemaVersion: 1,
      name: 'clinica',
      pages: [{ kind: 'resource', resource: 'paciente' }],
      ...(theme ? { theme } : {})
    }) as AppDefinition

  it('acepta una paleta del catálogo', () => {
    expect(defineApp(app({ palette: 'ocean' })).theme?.palette).toBe('ocean')
  })

  it('sin tema declarado, la app es neutra (lo que se emite hoy)', () => {
    expect(defineApp(app()).theme).toBeUndefined()
  })

  it('rechaza una paleta fuera del catálogo: el lienzo no es un editor de temas', () => {
    expect(() => defineApp(app({ palette: 'fucsia-flúor' }))).toThrow(/theme.*palette/i)
  })

  it('el catálogo publica los tokens de cada paleta en claro y en oscuro', () => {
    const ocean = PALETTES.find(p => p.id === 'ocean')

    expect(ocean).toMatchObject({
      id: 'ocean',
      label: expect.any(String),
      light: { primary: expect.any(String), primaryForeground: expect.any(String), ring: expect.any(String) },
      dark: { primary: expect.any(String), primaryForeground: expect.any(String) }
    })
  })

  it('neutral es la primera paleta: es el defecto y coincide con lo emitido hoy', () => {
    expect(PALETTES[0].id).toBe('neutral')
  })
})
