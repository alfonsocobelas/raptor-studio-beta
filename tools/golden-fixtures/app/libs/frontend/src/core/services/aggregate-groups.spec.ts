import { monthLabel } from './aggregate-groups'

describe('aggregate-groups — la etiqueta del mes', () => {
  it('traduce la clave del backend al nombre del mes', () => {
    expect(monthLabel('2026-01')).toContain('ene')
    expect(monthLabel('2026-12')).toContain('dic')
  })

  it('compone la fecha en hora LOCAL: new Date("2026-08") es UTC y descuadraría el mes', () => {
    // en cualquier huso al oeste de Greenwich, el parseo UTC devolvería julio
    expect(monthLabel('2026-08')).toContain('ago')
  })

  it('una clave que no es un mes se devuelve tal cual, sin inventar una fecha', () => {
    expect(monthLabel('pending')).toBe('pending')
    expect(monthLabel('')).toBe('')
  })
})
