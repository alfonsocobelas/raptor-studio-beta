import { describe, expect, it } from 'vitest'
import { AppStore } from './app-store'
import { addResourcePage, removePage } from './app-mutations'

describe('AppStore', () => {
  it('parte del app-schema boutique del catálogo y deriva la composición', () => {
    const store = new AppStore()

    expect(store.definition().name).toBe('boutique')
    expect(store.composition().pages.length).toBe(store.definition().pages.length)
    expect(store.composition().models.map(m => m.name)).toContain('garment')
  })

  it('apply aplica mutaciones válidas y recompone', () => {
    const store = new AppStore()
    const pagesBefore = store.composition().pages.length

    const ok = store.apply(def => removePage(def, pagesBefore - 1))

    expect(ok).toBe(true)
    expect(store.composition().pages.length).toBe(pagesBefore - 1)
  })

  it('apply rechaza mutaciones inválidas sin tocar el estado', () => {
    const store = new AppStore()
    const before = store.definition()

    const ok = store.apply(def => addResourcePage(def, 'garment')) // duplicada → defineApp lanza

    expect(ok).toBe(false)
    expect(store.definition()).toBe(before)
    expect(store.lastError()).toMatch(/duplicated resource page/)
  })

  it('schemaJson refleja el estado vivo', () => {
    const store = new AppStore()

    store.apply(def => removePage(def, def.pages.length - 1))

    const parsed = JSON.parse(store.schemaJson()) as { name: string; pages: { kind: string; resource?: string }[] }
    expect(parsed.name).toBe('boutique')
    expect(parsed.pages.some(p => p.kind === 'resource' && p.resource === 'movement')).toBe(false)
  })
})
