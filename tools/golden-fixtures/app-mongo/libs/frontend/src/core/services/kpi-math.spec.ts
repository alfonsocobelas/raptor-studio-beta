import { deltaOf, percentOf, progressOf } from './kpi-math'

describe('kpi-math — aritmética de la tarjeta', () => {
  it('la variación lleva dirección, absoluto y porcentaje', () => {
    expect(deltaOf(112, 100)).toEqual({ direction: 'up', percent: 12, absolute: 12 })
    expect(deltaOf(88, 100)).toEqual({ direction: 'down', percent: -12, absolute: -12 })
    expect(deltaOf(100, 100)).toEqual({ direction: 'flat', percent: 0, absolute: 0 })
  })

  it('con periodo anterior 0 informa del absoluto y NO del porcentaje', () => {
    expect(deltaOf(7, 0)).toEqual({ direction: 'up', absolute: 7 })
  })

  it('el porcentaje sobre total 0 es 0, no NaN', () => {
    expect(percentOf(3, 0)).toBe(0)
    expect(percentOf(1, 3)).toBe(33.3)
  })

  it('el progreso se satura al 100', () => {
    expect(progressOf(42, 60)).toBe(70)
    expect(progressOf(90, 60)).toBe(100)
    expect(progressOf(1, 0)).toBe(0)
  })
})
