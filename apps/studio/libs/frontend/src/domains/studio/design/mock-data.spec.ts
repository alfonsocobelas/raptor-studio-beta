import { describe, expect, it } from 'vitest'
import type { DraftResource } from '@app/shared/domain'
import { buildSampleRows } from './mock-data'

const fruta: DraftResource = {
  name: 'fruta',
  plural: 'frutas',
  labelSingular: 'Fruta',
  labelPlural: 'Frutas',
  gender: 'f',
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'string', samples: ['Manzana', 'Pera', 'Plátano', 'Naranja', 'Fresa'] },
    { name: 'precioKg', label: 'Precio €/kg', type: 'number' },
    { name: 'origen', label: 'Origen', type: 'string' },
    { name: 'disponible', label: 'Disponible', type: 'boolean' },
    { name: 'fechaAlta', label: 'Alta', type: 'date' },
    { name: 'email', label: 'Email', type: 'string' },
    { name: 'telefono', label: 'Teléfono', type: 'string' }
  ]
}

describe('buildSampleRows — mockup con sentido', () => {
  it('usa los samples de la IA cuando existen', () => {
    const rows = buildSampleRows(fruta, 3)

    expect(rows.map(r => r['nombre'])).toEqual(['Manzana', 'Pera', 'Plátano'])
  })

  it('heurísticas por nombre de campo: origen ciudades, email emails, teléfono teléfonos', () => {
    const rows = buildSampleRows(fruta, 2)

    expect(String(rows[0]['origen'])).toMatch(/Valencia|Murcia|Sevilla|Almería|Huelva/)
    expect(String(rows[0]['email'])).toContain('@')
    expect(String(rows[0]['telefono'])).toMatch(/^6\d{2} \d{3} \d{3}$/)
  })

  it('booleanos legibles (Sí/No), fechas legibles y precios con céntimos', () => {
    const rows = buildSampleRows(fruta, 2)

    expect(['Sí', 'No']).toContain(rows[0]['disponible'])
    expect(String(rows[0]['fechaAlta'])).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
    expect(Number(rows[0]['precioKg'])).toBeGreaterThan(0)
    expect(Number(rows[0]['precioKg'])).toBeLessThan(30)
  })

  it('es determinista', () => {
    expect(buildSampleRows(fruta, 5)).toEqual(buildSampleRows(fruta, 5))
  })
})
