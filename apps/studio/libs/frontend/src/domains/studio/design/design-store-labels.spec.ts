import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'

/**
 * Renombrar una entidad (2026-08-27). Se editan sus ETIQUETAS, nunca su identificador: `name` y
 * `plural` los referencian los bloques, las páginas y las relaciones, y las rutas de la app salen
 * de ahí.
 */
describe('DesignStore — renombrar una entidad', () => {
  const storeWith = (): DesignStore => {
    const store = new DesignStore()
    store.addResource('Cliente')
    return store
  }

  it('cambia singular, plural, género y entradilla', () => {
    const store = storeWith()

    const ok = store.setResourceLabels('cliente', {
      labelSingular: 'Factura',
      labelPlural: 'Facturas',
      gender: 'f',
      subtitle: 'Las facturas emitidas'
    })

    expect(ok).toBe(true)
    expect(store.resources()[0]).toMatchObject({
      labelSingular: 'Factura',
      labelPlural: 'Facturas',
      gender: 'f',
      subtitle: 'Las facturas emitidas'
    })
  })

  it('NO toca el identificador: lo referencian los bloques y las relaciones', () => {
    const store = storeWith()

    store.setResourceLabels('cliente', { labelSingular: 'Factura', labelPlural: 'Facturas' })

    expect(store.resources()[0]).toMatchObject({ name: 'cliente', plural: 'clientes' })
  })

  it('un cambio parcial deja lo demás como estaba', () => {
    const store = storeWith()

    store.setResourceLabels('cliente', { labelPlural: 'Clientela' })

    expect(store.resources()[0]).toMatchObject({ labelSingular: 'Cliente', labelPlural: 'Clientela' })
  })

  it('rechaza una etiqueta vacía: la app quedaría con un menú sin nombre', () => {
    const store = storeWith()

    expect(store.setResourceLabels('cliente', { labelSingular: '   ' })).toBe(false)
    expect(store.resources()[0].labelSingular).toBe('Cliente')
  })

  it('la entradilla vacía se borra, no se guarda en blanco', () => {
    const store = storeWith()
    store.setResourceLabels('cliente', { subtitle: 'Algo' })

    store.setResourceLabels('cliente', { subtitle: '  ' })

    expect(store.resources()[0]).not.toHaveProperty('subtitle')
  })

  it('recorta los espacios de los lados', () => {
    const store = storeWith()

    store.setResourceLabels('cliente', { labelSingular: '  Factura  ' })

    expect(store.resources()[0].labelSingular).toBe('Factura')
  })

  it('rechaza una entidad que no existe', () => {
    const store = storeWith()

    expect(store.setResourceLabels('fantasma', { labelSingular: 'X' })).toBe(false)
  })
})
