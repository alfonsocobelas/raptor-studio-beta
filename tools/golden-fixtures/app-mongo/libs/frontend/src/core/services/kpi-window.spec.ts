import { localDay, previousRange, windowRange } from './kpi-window'

describe('kpi-window — ventanas relativas del panel', () => {
  // 2026-08-27 es un jueves
  const now = new Date(2026, 7, 27, 13, 45)

  it('compone el día con las partes locales, sin desplazar a UTC', () => {
    expect(localDay(new Date(2026, 7, 1, 0, 30))).toBe('2026-08-01')
    expect(localDay(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31')
  })

  it('hoy es un rango de un día', () => {
    expect(windowRange('today', undefined, now)).toEqual({ start: '2026-08-27', end: '2026-08-28' })
  })

  it('la semana empieza el lunes', () => {
    expect(windowRange('week', undefined, now)).toEqual({ start: '2026-08-24', end: '2026-08-31' })
  })

  it('el mes, el trimestre y el año van del primer día al primero del siguiente', () => {
    expect(windowRange('month', undefined, now)).toEqual({ start: '2026-08-01', end: '2026-09-01' })
    expect(windowRange('quarter', undefined, now)).toEqual({ start: '2026-07-01', end: '2026-10-01' })
    expect(windowRange('year', undefined, now)).toEqual({ start: '2026-01-01', end: '2027-01-01' })
  })

  it('últimos N días incluye hoy', () => {
    expect(windowRange('days', 7, now)).toEqual({ start: '2026-08-21', end: '2026-08-28' })
    expect(windowRange('days', 1, now)).toEqual({ start: '2026-08-27', end: '2026-08-28' })
  })

  it('el rango anterior tiene la misma longitud y acaba donde empieza el actual', () => {
    expect(previousRange('month', undefined, now)).toEqual({ start: '2026-07-01', end: '2026-08-01' })
    expect(previousRange('week', undefined, now)).toEqual({ start: '2026-08-17', end: '2026-08-24' })
    expect(previousRange('today', undefined, now)).toEqual({ start: '2026-08-26', end: '2026-08-27' })
    expect(previousRange('days', 7, now)).toEqual({ start: '2026-08-14', end: '2026-08-21' })
  })

  it('cruza el año hacia atrás sin descuadrarse', () => {
    const january = new Date(2026, 0, 15)

    expect(previousRange('month', undefined, january)).toEqual({ start: '2025-12-01', end: '2026-01-01' })
    expect(previousRange('quarter', undefined, january)).toEqual({ start: '2025-10-01', end: '2026-01-01' })
    expect(previousRange('year', undefined, january)).toEqual({ start: '2025-01-01', end: '2026-01-01' })
  })
})
