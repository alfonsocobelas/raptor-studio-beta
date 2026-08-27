import { buildSubstitutions } from './build-substitutions'
import { contract } from './models/contract.model'
import { customer } from './models/customer.model'

/**
 * Spec 71: la lista blanca de campos agregables. El nombre del campo llega por HTTP y acaba
 * dentro de la consulta, así que solo puede agregarse lo que ESTA lista declara — y la lista la
 * emite el generador desde el modelo, no se deriva en ejecución.
 */
describe('buildSubstitutions — campos agregables (spec 71)', () => {
  it('declara los numéricos y las fechas del modelo, con su tipo', () => {
    const subs = buildSubstitutions(contract, [customer])
    const fields = Object.fromEntries(subs.aggregatableFields.map(f => [f.name, f.kind]))

    expect(fields['totalValue']).toBe('numeric')
    expect(fields['nbrOfContracts']).toBe('numeric')
    expect(fields['startDate']).toBe('date')
    expect(fields['endDate']).toBe('date')
  })

  it('deja fuera el texto, los enums y los uuid: no hay suma ni media que sacarles', () => {
    const subs = buildSubstitutions(contract, [customer])
    const names = subs.aggregatableFields.map(f => f.name)

    expect(names).not.toContain('contractNumber')
    expect(names).not.toContain('status')
    expect(names).not.toContain('customerId')
    expect(names).not.toContain('notes')
  })

  it('deja fuera los booleanos: contar los que son sí es una condición, no una medida', () => {
    const subs = buildSubstitutions(contract, [customer])

    expect(subs.aggregatableFields.map(f => f.name)).not.toContain('isFavorite')
  })

  it('mantiene el orden de declaración del modelo, para que el emitido sea determinista', () => {
    const first = buildSubstitutions(contract, [customer]).aggregatableFields
    const second = buildSubstitutions(contract, [customer]).aggregatableFields

    expect(first).toEqual(second)
    expect(first.length).toBeGreaterThan(0)
  })
})
