import type { FieldDefinition } from './resource-types'
import { operatorsFor, valueControlFor } from './kpi-operators'

const field = (definition: Partial<FieldDefinition>): FieldDefinition => definition as FieldDefinition

describe('operatorsFor — los operadores que cada tipo admite (spec 70)', () => {
  it('un enum solo compara por igualdad: contains sobre un enum es un error de diseño', () => {
    const status = field({ type: 'string', vo: { name: 'Status', fieldName: 'status', values: ['pending', 'active'] } })

    expect(operatorsFor(status)).toEqual(['eq', 'neq'])
  })

  it('un booleano, igual', () => {
    expect(operatorsFor(field({ type: 'boolean' }))).toEqual(['eq', 'neq'])
  })

  it('los numéricos y las fechas añaden las comparaciones de orden', () => {
    const expected = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']

    expect(operatorsFor(field({ type: 'number' }))).toEqual(expected)
    expect(operatorsFor(field({ type: 'integer' }))).toEqual(expected)
    expect(operatorsFor(field({ type: 'date' }))).toEqual(expected)
    expect(operatorsFor(field({ type: 'timestamptz' }))).toEqual(expected)
  })

  it('el texto añade las de subcadena, no las de orden', () => {
    expect(operatorsFor(field({ type: 'string' }))).toEqual(['eq', 'neq', 'contains', 'starts_with', 'ends_with'])
    expect(operatorsFor(field({ type: 'text' }))).toEqual(['eq', 'neq', 'contains', 'starts_with', 'ends_with'])
  })

  it('un uuid solo por igualdad', () => {
    expect(operatorsFor(field({ type: 'uuid' }))).toEqual(['eq', 'neq'])
  })
})

describe('valueControlFor — con qué control se pide el valor', () => {
  it('enum con select, y el resto según su tipo', () => {
    expect(valueControlFor(field({ type: 'string', vo: { name: 'S', fieldName: 's', values: ['a'] } }))).toBe('select')
    expect(valueControlFor(field({ type: 'boolean' }))).toBe('boolean')
    expect(valueControlFor(field({ type: 'number' }))).toBe('number')
    expect(valueControlFor(field({ type: 'integer' }))).toBe('number')
    expect(valueControlFor(field({ type: 'date' }))).toBe('date')
    expect(valueControlFor(field({ type: 'timestamptz' }))).toBe('date')
    expect(valueControlFor(field({ type: 'string' }))).toBe('text')
    expect(valueControlFor(field({ type: 'text' }))).toBe('text')
  })
})
