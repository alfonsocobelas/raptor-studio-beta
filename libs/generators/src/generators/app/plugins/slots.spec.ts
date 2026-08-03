import { SLOTS, normalizeLegacyPlugins, selectEngine, selectProvider, slotPlugins, validateCombination } from './slots'
import { authPlugin } from './auth.plugin'
import { emailPlugin } from './email.plugin'
import { observabilityPlugin } from './observability.plugin'

/**
 * TASK-01 (spec 23): las decisiones excluyentes del generador (elige-un-proveedor)
 * dejan de ser opciones planas y viven en un registro de ranuras. Se migra lo que
 * ya existe: database (postgres|mongo) y ui (spartan|material).
 */
describe('SLOTS', () => {
  it('registers the four exclusive decisions of the emitted app', () => {
    expect(Object.keys(SLOTS)).toEqual(['database', 'ui', 'infra', 'auth'])
  })

  it('database offers postgres (default) and mongo', () => {
    const slot = SLOTS['database']

    expect(slot.default).toBe('postgres')
    expect(slot.providers.map(p => p.value)).toEqual(['postgres', 'mongo'])
  })

  it('ui offers spartan (default) and material', () => {
    const slot = SLOTS['ui']

    expect(slot.default).toBe('spartan')
    expect(slot.providers.map(p => p.value)).toEqual(['spartan', 'material'])
  })

  it('auth offers none (default) and single-tenant, which carries the auth plugin manifest', () => {
    // TASK-03 (spec 23): auth deja de ser checkbox aditivo y pasa a ranura excluyente
    const slot = SLOTS['auth']

    expect(slot.default).toBe('none')
    expect(slot.providers.map(p => p.value)).toEqual(['none', 'single-tenant'])
    expect(slot.providers.find(p => p.value === 'none')?.plugin).toBeUndefined()
    expect(slot.providers.find(p => p.value === 'single-tenant')?.plugin?.name).toBe('auth')
  })

  it('single-tenant auth declares its postgres requirement on the database slot', () => {
    expect(SLOTS['auth'].providers.find(p => p.value === 'single-tenant')?.requires).toEqual({ database: 'postgres' })
  })

  it('infra is declared with only the none provider (real providers land in later specs)', () => {
    expect(SLOTS['infra'].default).toBe('none')
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none'])
  })

  it('every slot declares label, a default that exists and labelled providers (what the form shows)', () => {
    for (const slot of Object.values(SLOTS)) {
      expect(slot.label.length).toBeGreaterThan(0)
      expect(slot.providers.map(p => p.value)).toContain(slot.default)
      for (const provider of slot.providers) {
        expect(provider.label.length).toBeGreaterThan(0)
      }
    }
  })
})

describe('selectProvider', () => {
  it('resolves a registered provider by value', () => {
    expect(selectProvider('database', 'mongo').value).toBe('mongo')
    expect(selectProvider('ui', 'material').value).toBe('material')
  })

  it('falls back to the slot default when the value is undefined', () => {
    expect(selectProvider('database', undefined).value).toBe('postgres')
    expect(selectProvider('ui', undefined).value).toBe('spartan')
  })

  it('throws for an unknown value listing the available providers', () => {
    expect(() => selectProvider('database', 'oracle')).toThrow(/Unknown database 'oracle'.*postgres, mongo/)
  })

  it('throws for an unknown slot listing the registered slots', () => {
    expect(() => selectProvider('flavour', 'vanilla')).toThrow(/Unknown slot 'flavour'.*database, ui/)
  })
})

describe('selectEngine', () => {
  it('resolves the persistence engine through the registry, typed', () => {
    // TASK-04 (spec 23): sustituye a selectDatabase — un único validador, el registro
    expect(selectEngine(undefined)).toBe('postgres')
    expect(selectEngine('mongo')).toBe('mongo')
  })

  it('rejects an unknown engine listing the registered ones', () => {
    expect(() => selectEngine('mysql')).toThrow(/Unknown database 'mysql'.*postgres, mongo/)
  })
})

describe('slotPlugins', () => {
  it('returns the emission manifests of the chosen providers', () => {
    expect(slotPlugins({ auth: 'single-tenant' }).map(p => p.name)).toEqual(['auth'])
  })

  it('returns nothing when every slot sits on a provider without manifest', () => {
    expect(slotPlugins({ auth: 'none', database: 'postgres', ui: 'spartan' })).toEqual([])
    expect(slotPlugins({})).toEqual([])
  })
})

describe('normalizeLegacyPlugins', () => {
  it('maps the legacy --plugins=auth to the auth slot with a deprecation notice', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const normalized = normalizeLegacyPlugins('auth,email', undefined)

    expect(normalized).toEqual({ plugins: 'email', auth: 'single-tenant' })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('--auth=single-tenant'))
    warn.mockRestore()
  })

  it('leaves additive-only lists and an explicit auth choice untouched', () => {
    expect(normalizeLegacyPlugins('email,observability', 'none')).toEqual({
      plugins: 'email,observability',
      auth: 'none'
    })
    expect(normalizeLegacyPlugins(undefined, undefined)).toEqual({ plugins: undefined, auth: undefined })
  })

  it('keeps an explicit non-default --auth when the legacy name is also present', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(normalizeLegacyPlugins('auth', 'single-tenant')).toEqual({ plugins: '', auth: 'single-tenant' })

    warn.mockRestore()
  })

  it('maps the legacy name even when Nx has filled auth with the slot default', () => {
    // Nx rellena los defaults del schema.json, así que por CLI auth llega 'none', nunca undefined:
    // sin esto el nombre heredado se ignoraba en silencio y la app salía sin autenticación
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    expect(normalizeLegacyPlugins('auth,email', 'none')).toEqual({ plugins: 'email', auth: 'single-tenant' })

    warn.mockRestore()
  })
})

/**
 * TASK-02 (spec 23): las restricciones entre ranuras se declaran (`requires`) en el
 * manifiesto del proveedor o del plugin aditivo, y un único validador las aplica
 * antes de emitir nada. Sustituye al guard `requiresDatabase` ad-hoc de selectPlugins.
 */
describe('validateCombination', () => {
  it('accepts a valid selection with no plugins', () => {
    expect(() => validateCombination({ database: 'mongo', ui: 'material' })).not.toThrow()
  })

  it('validates the selected values against the registry (unknown value throws)', () => {
    expect(() => validateCombination({ database: 'oracle' })).toThrow(/Unknown database 'oracle'/)
  })

  it('rejects a slot provider whose requires contradicts another slot', () => {
    // TASK-03: la restricción viaja en el manifiesto del proveedor, no en un guard a medida
    expect(() => validateCombination({ database: 'mongo', auth: 'single-tenant' })).toThrow(
      /single-tenant.*requires database=postgres.*mongo/
    )
  })

  it('rejects an additive plugin whose requires contradicts the selection', () => {
    // v1: auth emite persistencia TypeORM; adaptarlo a mongo es una spec posterior
    expect(() => validateCombination({ database: 'mongo' }, [authPlugin])).toThrow(/auth.*postgres.*mongo/)
  })

  it('allows requirement-free plugins with any engine', () => {
    expect(() => validateCombination({ database: 'mongo' }, [emailPlugin, observabilityPlugin])).not.toThrow()
  })

  it('resolves unstated slots to their default before checking requirements', () => {
    // sin database explícita la selección es postgres, que es lo que auth exige
    expect(() => validateCombination({}, [authPlugin])).not.toThrow()
  })
})
