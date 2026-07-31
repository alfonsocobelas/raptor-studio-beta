import { describe, expect, it } from 'vitest'
import type { ResourceDefinition } from '@acc/schema'
import { sampleRows, sampleTotal, visibleColumns } from './sample-data'

const model = {
  schemaVersion: 1,
  name: 'garment',
  plural: 'garments',
  context: 'warehouse',
  schemaName: 'warehouse',
  labels: { singular: 'Prenda', plural: 'Prendas', gender: 'f' },
  fields: {
    id: { type: 'uuid', pk: true },
    sku: {
      type: 'string',
      table: { show: true, order: 1, label: 'SKU', minWidth: 120 }
    },
    name: {
      type: 'string',
      table: { show: true, order: 0, label: 'Nombre' }
    },
    price: {
      type: 'number',
      table: { show: true, order: 2, label: 'Precio', type: 'number' }
    },
    status: {
      type: 'string',
      table: {
        show: true,
        order: 3,
        label: 'Estado',
        type: 'badge',
        badgeMap: { in_stock: { label: 'En stock', variant: 'default' }, sold: { label: 'Vendida', variant: 'outline' } }
      }
    },
    receivedAt: {
      type: 'date',
      table: { show: true, order: 4, label: 'Recepción', type: 'date' }
    },
    internalNotes: { type: 'text' }
  }
} as unknown as ResourceDefinition

describe('visibleColumns', () => {
  it('incluye solo campos con table.show, ordenados por table.order', () => {
    const cols = visibleColumns(model)

    expect(cols.map(c => c.key)).toEqual(['name', 'sku', 'price', 'status', 'receivedAt'])
    expect(cols[1]).toMatchObject({ key: 'sku', label: 'SKU', minWidth: 120 })
  })

  it('propaga el tipo de columna y el badgeMap del schema', () => {
    const cols = visibleColumns(model)

    expect(cols.find(c => c.key === 'price')?.type).toBe('number')
    expect(cols.find(c => c.key === 'status')?.badgeMap).toHaveProperty('in_stock')
  })

  it('devuelve vacío si ningún campo es visible', () => {
    const bare = { ...model, fields: { id: { type: 'uuid', pk: true } } } as unknown as ResourceDefinition

    expect(visibleColumns(bare)).toEqual([])
  })
})

describe('sampleRows', () => {
  it('es determinista: misma entrada, mismas filas', () => {
    expect(sampleRows(model, 3)).toEqual(sampleRows(model, 3))
  })

  it('genera valores plausibles por tipo', () => {
    const rows = sampleRows(model, 2)

    expect(rows).toHaveLength(2)
    expect(rows[0]['name']).toBe('Prenda 1')
    expect(rows[1]['name']).toBe('Prenda 2')
    expect(typeof rows[0]['price']).toBe('number')
    expect(rows[0]['status']).toBe('in_stock')
    expect(rows[1]['status']).toBe('sold')
    expect(String(rows[0]['receivedAt'])).toMatch(/^2026-/)
  })

  it('las filas solo contienen columnas visibles', () => {
    const rows = sampleRows(model, 1)

    expect(Object.keys(rows[0]).sort()).toEqual(['name', 'price', 'receivedAt', 'sku', 'status'])
  })
})

describe('sampleTotal', () => {
  it('es determinista y distinto por posición', () => {
    expect(sampleTotal(0)).toBe(7)
    expect(sampleTotal(1)).toBe(14)
    expect(sampleTotal(2)).toBe(21)
  })
})
