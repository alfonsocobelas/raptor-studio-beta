import { describe, expect, it } from 'vitest'
import { DesignStore } from './design-store'

/** Spec 61: el bloque kanban enciende la config en la entidad y viaja como página kanban. */
describe('DesignStore — bloque kanban (spec 61)', () => {
  const storeWithEnum = (): DesignStore => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addField('pedido')
    store.updateField('pedido', 1, {
      name: 'estado',
      label: 'Estado',
      type: 'enum',
      values: [
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'entregado', label: 'Entregado' }
      ]
    })
    store.addPage('blank', 'Tablero')
    return store
  }

  it('al soltar el bloque propone el primer campo enum de la entidad', () => {
    const store = storeWithEnum()

    store.addBlock(1, { kind: 'kanban', resource: 'pedido' })

    expect(store.pages()[1].blocks[0]).toMatchObject({ kind: 'kanban', columnsField: 'estado' })
    expect(store.resources()[0].kanban).toEqual({ field: 'estado' })
    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource', 'kanban'])
  })

  it('con máquina de estados propone su campo, aunque haya otro enum antes', () => {
    const store = storeWithEnum()
    store.addField('pedido')
    store.updateField('pedido', 2, {
      name: 'fase',
      label: 'Fase',
      type: 'enum',
      values: [
        { value: 'abierta', label: 'Abierta' },
        { value: 'cerrada', label: 'Cerrada' }
      ]
    })
    store.promoteState('pedido', 'fase')

    store.addBlock(1, { kind: 'kanban', resource: 'pedido' })

    expect(store.pages()[1].blocks[0].columnsField).toBe('fase')
  })

  it('sin campo enum el bloque queda como diseño: ni bandera ni página', () => {
    const store = new DesignStore()
    store.addPage('list', 'Pedidos')
    store.addPage('blank', 'Tablero')

    store.addBlock(1, { kind: 'kanban', resource: 'pedido' })

    expect(store.pages()[1].blocks[0].columnsField).toBeUndefined()
    expect(store.resources()[0].kanban).toBeUndefined()
    expect(store.toAppSchema().pages.map(p => p.kind)).toEqual(['resource'])
  })

  it('quitar el bloque apaga la configuración de la entidad', () => {
    const store = storeWithEnum()
    store.addBlock(1, { kind: 'kanban', resource: 'pedido' })

    store.removeBlock(1, 0)

    expect(store.resources()[0].kanban).toBeUndefined()
  })

  it('el panel del bloque replica columnas y etiqueta en la entidad', () => {
    const store = storeWithEnum()
    store.addBlock(1, { kind: 'kanban', resource: 'pedido' })

    store.setKanbanConfig(1, 0, { labelField: 'nombre' })

    expect(store.pages()[1].blocks[0]).toMatchObject({ columnsField: 'estado', labelField: 'nombre' })
    expect(store.resources()[0].kanban).toEqual({ field: 'estado', labelField: 'nombre' })
  })

  it('el export expande la config al resource-schema', () => {
    const store = storeWithEnum()
    store.addBlock(1, { kind: 'kanban', resource: 'pedido' })

    const resource = Object.values(store.registry())[0]

    expect(resource.kanban).toEqual({ field: 'estado' })
  })
})
