import { AGGREGATE_OPS, opAllowedOn, opsAllowedOn } from './aggregate-ops'

describe('aggregate — qué operación admite cada tipo de campo (spec 71)', () => {
  it('sumar y promediar solo tiene sentido sobre números', () => {
    expect(opAllowedOn('sum', 'numeric')).toBe(true)
    expect(opAllowedOn('avg', 'numeric')).toBe(true)
    // sumar dos fechas no es una pregunta con respuesta
    expect(opAllowedOn('sum', 'date')).toBe(false)
    expect(opAllowedOn('avg', 'date')).toBe(false)
  })

  it('máximo, mínimo y distintos valen para números y fechas', () => {
    for (const op of ['min', 'max', 'distinct'] as const) {
      expect(opAllowedOn(op, 'numeric')).toBe(true)
      expect(opAllowedOn(op, 'date')).toBe(true)
    }
  })

  it('las cinco operaciones son las que el catálogo declara', () => {
    expect(AGGREGATE_OPS).toEqual(['sum', 'avg', 'min', 'max', 'distinct'])
  })

  it('opsAllowedOn da las operaciones de un tipo, en orden del catálogo', () => {
    expect(opsAllowedOn('numeric')).toEqual(['sum', 'avg', 'min', 'max', 'distinct'])
    expect(opsAllowedOn('date')).toEqual(['min', 'max', 'distinct'])
  })
})
