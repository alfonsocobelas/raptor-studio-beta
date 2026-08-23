import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'

/** Spec 59: el bloque calendario enciende la config en la entidad y viaja como página calendar. */
describe('DesignStore — bloque calendario (spec 59)', () => {
  const storeWithDate = (): DesignStore => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addField('pedido')
    store.updateField('pedido', 1, { name: 'entrega', label: 'Entrega', type: 'date' })
    store.addPage('blank', 'Entregas')
    return store
  }

  it('al soltar el bloque propone el primer campo fecha de la entidad', () => {
    const store = storeWithDate()

    store.addBlock(1, { kind: 'calendar', resource: 'pedido' })

    expect(store.pages()[1].blocks[0]).toMatchObject({ kind: 'calendar', dateField: 'entrega' })
    expect(store.resources()[0].calendar).toEqual({ dateField: 'entrega' })
    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource', 'calendar'])
  })

  it('sin campo fecha el bloque queda como diseño: ni bandera ni página', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Entregas')

    store.addBlock(1, { kind: 'calendar', resource: 'pedido' })

    expect(store.pages()[1].blocks[0].dateField).toBeUndefined()
    expect(store.resources()[0].calendar).toBeUndefined()
    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource'])
  })

  it('quitar el bloque apaga la configuración de la entidad', () => {
    const store = storeWithDate()
    store.addBlock(1, { kind: 'calendar', resource: 'pedido' })

    store.removeBlock(1, 0)

    expect(store.resources()[0].calendar).toBeUndefined()
    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource'])
  })

  it('el panel del bloque replica etiqueta, color y fin de semana en la entidad', () => {
    const store = storeWithDate()
    store.updateField('pedido', 0, { name: 'nombre', label: 'Proveedor' })
    store.addBlock(1, { kind: 'calendar', resource: 'pedido' })

    store.setCalendarConfig(1, 0, { labelField: 'nombre', weekends: false })

    expect(store.pages()[1].blocks[0]).toMatchObject({ dateField: 'entrega', labelField: 'nombre', weekends: false })
    expect(store.resources()[0].calendar).toEqual({ dateField: 'entrega', labelField: 'nombre', weekends: false })
  })

  it('el export expande la config al resource-schema', () => {
    const store = storeWithDate()
    store.addBlock(1, { kind: 'calendar', resource: 'pedido' })
    store.setCalendarConfig(1, 0, { weekends: false })

    const resource = Object.values(store.registry())[0]

    expect(resource.calendar).toEqual({ date: 'entrega', weekends: false })
  })
})
