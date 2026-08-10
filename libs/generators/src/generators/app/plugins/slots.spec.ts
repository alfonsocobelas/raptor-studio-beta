import { SLOTS, normalizeLegacyPlugins, selectEngine, selectProvider, slotPlugins, validateCombination } from './slots'
import { authPlugin } from './auth.plugin'
import { emailPlugin } from './email.plugin'

/**
 * TASK-01 (spec 23): las decisiones excluyentes del generador (elige-un-proveedor)
 * dejan de ser opciones planas y viven en un registro de ranuras. Se migra lo que
 * ya existe: database (postgres|mongo) y ui.
 *
 * ui tiene un solo proveedor desde la spec 36 (retirada de material): las dos pieles
 * emitían apps indistinguibles, y la variedad visual la lleva ahora la ranura `design`.
 */
describe('SLOTS', () => {
  it('registers the five exclusive decisions of the emitted app', () => {
    // design entra en la spec 37: la variedad visual no venía de la librería de componentes
    expect(Object.keys(SLOTS)).toEqual(['database', 'ui', 'design', 'infra', 'auth'])
  })

  it('database offers postgres (default) and mongo', () => {
    const slot = SLOTS['database']

    expect(slot.default).toBe('postgres')
    expect(slot.providers.map(p => p.value)).toEqual(['postgres', 'mongo'])
  })

  it('ui offers only spartan (material retired, spec 36)', () => {
    const slot = SLOTS['ui']

    expect(slot.default).toBe('spartan')
    expect(slot.providers.map(p => p.value)).toEqual(['spartan'])
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

  it('infra ofrece none (default) y azure; sus proveedores salen de los manifiestos', () => {
    // spec 24: los proveedores reales entran por app/infra/providers.ts, no aquí
    expect(SLOTS['infra'].default).toBe('none')
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none', 'azure'])
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
    expect(selectProvider('ui', 'spartan').value).toBe('spartan')
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
  const silenced = <T>(run: () => T): T => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    try {
      return run()
    } finally {
      warn.mockRestore()
    }
  }

  it('traduce el heredado --plugins=auth a su ranura con aviso de deprecación', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const normalized = normalizeLegacyPlugins('auth,email', {})

    expect(normalized).toEqual({ plugins: 'email', selection: { auth: 'single-tenant' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('--auth=single-tenant'))
    warn.mockRestore()
  })

  it('traduce --plugins=observability a la ranura de infraestructura (spec 24)', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const normalized = normalizeLegacyPlugins('observability,email', {})

    expect(normalized).toEqual({ plugins: 'email', selection: { infra: 'azure' } })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('--infra=azure'))
    warn.mockRestore()
  })

  it('traduce los dos nombres heredados a la vez', () => {
    const normalized = silenced(() => normalizeLegacyPlugins('auth,email,observability', {}))

    expect(normalized).toEqual({ plugins: 'email', selection: { auth: 'single-tenant', infra: 'azure' } })
  })

  it('deja intactas las listas sólo-aditivas', () => {
    expect(normalizeLegacyPlugins('email', { auth: 'none' })).toEqual({
      plugins: 'email',
      selection: { auth: 'none' }
    })
    expect(normalizeLegacyPlugins(undefined, {})).toEqual({ plugins: undefined, selection: {} })
  })

  it('respeta un valor de ranura elegido explícitamente frente al nombre heredado', () => {
    expect(silenced(() => normalizeLegacyPlugins('auth', { auth: 'single-tenant' }))).toEqual({
      plugins: '',
      selection: { auth: 'single-tenant' }
    })
  })

  it('traduce aunque Nx haya rellenado la ranura con su default', () => {
    // Nx rellena los defaults del schema.json, así que por CLI la opción llega siempre con valor:
    // sin esto el nombre heredado se ignoraba en silencio y la app salía sin la capacidad
    expect(silenced(() => normalizeLegacyPlugins('auth,email', { auth: 'none' }))).toEqual({
      plugins: 'email',
      selection: { auth: 'single-tenant' }
    })
    expect(silenced(() => normalizeLegacyPlugins('observability', { infra: 'none' }))).toEqual({
      plugins: '',
      selection: { infra: 'azure' }
    })
  })
})

/**
 * TASK-02 (spec 23): las restricciones entre ranuras se declaran (`requires`) en el
 * manifiesto del proveedor o del plugin aditivo, y un único validador las aplica
 * antes de emitir nada. Sustituye al guard `requiresDatabase` ad-hoc de selectPlugins.
 */
describe('validateCombination', () => {
  it('accepts a valid selection with no plugins', () => {
    expect(() => validateCombination({ database: 'mongo', ui: 'spartan' })).not.toThrow()
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
    expect(() => validateCombination({ database: 'mongo' }, [emailPlugin])).not.toThrow()
  })

  it('resolves unstated slots to their default before checking requirements', () => {
    // sin database explícita la selección es postgres, que es lo que auth exige
    expect(() => validateCombination({}, [authPlugin])).not.toThrow()
  })
})
