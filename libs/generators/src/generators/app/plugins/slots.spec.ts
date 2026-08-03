import { SLOTS, selectProvider } from './slots'

/**
 * TASK-01 (spec 22): las decisiones excluyentes del generador (elige-un-proveedor)
 * dejan de ser opciones planas y viven en un registro de ranuras. Se migra lo que
 * ya existe: database (postgres|mongo) y ui (spartan|material).
 */
describe('SLOTS', () => {
  it('registers the two existing exclusive decisions: database and ui', () => {
    expect(Object.keys(SLOTS)).toEqual(['database', 'ui'])
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
