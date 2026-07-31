import { describe, expect, it } from 'vitest'
import type { AppDefinition, ResourceDefinition } from '@acc/schema'
import {
  addKpiWidget,
  addResourcePage,
  movePage,
  paletteOf,
  removePage,
  removeWidget
} from './app-mutations'

const def = (): AppDefinition => ({
  schemaVersion: 1,
  name: 'boutique',
  pages: [
    {
      kind: 'dashboard',
      widgets: [
        { kind: 'kpi-total', resource: 'garment' },
        { kind: 'kpi-total', resource: 'supplier' }
      ]
    },
    { kind: 'resource', resource: 'garment' },
    { kind: 'resource', resource: 'supplier' }
  ]
})

const registry = Object.fromEntries(
  ['garment', 'supplier', 'movement'].map(name => [
    name,
    { name, plural: `${name}s`, labels: { plural: name } } as unknown as ResourceDefinition
  ])
)

describe('removePage', () => {
  it('elimina la página y no muta la definición original', () => {
    const original = def()
    const result = removePage(original, 1)

    expect(result.pages).toHaveLength(2)
    expect(result.pages.some(p => p.kind === 'resource' && p.resource === 'garment')).toBe(false)
    expect(original.pages).toHaveLength(3)
  })

  it('bloquea quedarse sin páginas', () => {
    const single: AppDefinition = { schemaVersion: 1, name: 'x', pages: [{ kind: 'resource', resource: 'garment' }] }

    expect(() => removePage(single, 0)).toThrow()
  })
})

describe('removeWidget', () => {
  it('elimina el widget del dashboard', () => {
    const result = removeWidget(def(), 0, 0)
    const dashboard = result.pages[0]

    expect(dashboard.kind).toBe('dashboard')
    if (dashboard.kind === 'dashboard') {
      expect(dashboard.widgets.map(w => w.resource)).toEqual(['supplier'])
    }
  })

  it('si era el último widget, elimina la página dashboard entera', () => {
    const afterOne = removeWidget(def(), 0, 0)
    const afterAll = removeWidget(afterOne, 0, 0)

    expect(afterAll.pages.every(p => p.kind !== 'dashboard')).toBe(true)
    expect(afterAll.pages).toHaveLength(2)
  })
})

describe('movePage', () => {
  it('reordena páginas (el orden gobierna nav y rutas)', () => {
    const result = movePage(def(), 2, 0)

    expect(result.pages[0]).toMatchObject({ kind: 'resource', resource: 'supplier' })
    expect(result.pages[1].kind).toBe('dashboard')
  })
})

describe('addResourcePage / addKpiWidget', () => {
  it('añade página de un recurso del catálogo', () => {
    const result = addResourcePage(def(), 'movement')

    expect(result.pages.at(-1)).toMatchObject({ kind: 'resource', resource: 'movement' })
  })

  it('rechaza duplicar página (gate defineApp)', () => {
    expect(() => addResourcePage(def(), 'garment')).toThrow()
  })

  it('añade KPI al dashboard existente', () => {
    const result = addKpiWidget(def(), 'movement')
    const dashboard = result.pages[0]

    if (dashboard.kind === 'dashboard') {
      expect(dashboard.widgets.map(w => w.resource)).toEqual(['garment', 'supplier', 'movement'])
    } else {
      throw new Error('dashboard esperado')
    }
  })

  it('crea el dashboard al principio si no existe', () => {
    const noDash: AppDefinition = {
      schemaVersion: 1,
      name: 'x',
      pages: [{ kind: 'resource', resource: 'garment' }]
    }
    const result = addKpiWidget(noDash, 'garment')

    expect(result.pages[0]).toMatchObject({ kind: 'dashboard' })
  })
})

describe('paletteOf', () => {
  it('deriva del catálogo: recursos sin página y KPIs sin tarjeta', () => {
    const palette = paletteOf(def(), registry)

    expect(palette.resourcePages).toEqual(['movement'])
    expect(palette.kpiWidgets).toEqual(['movement'])
    expect(palette.dashboard).toBe(false)
  })

  it('ofrece dashboard cuando no existe', () => {
    const noDash: AppDefinition = {
      schemaVersion: 1,
      name: 'x',
      pages: [{ kind: 'resource', resource: 'garment' }]
    }

    expect(paletteOf(noDash, registry).dashboard).toBe(true)
    expect(paletteOf(noDash, registry).kpiWidgets).toEqual(['garment', 'supplier', 'movement'])
  })
})
