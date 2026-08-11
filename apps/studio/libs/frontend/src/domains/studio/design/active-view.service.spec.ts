import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

describe('ActiveViewService', () => {
  let active: ActiveViewService
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    active = TestBed.inject(ActiveViewService)
    store = TestBed.inject(DesignStore)
  })

  it('arranca en la primera vista', () => {
    expect(active.index()).toBe(0)
  })

  it('la selección es la que manda mientras exista', () => {
    store.addPage('list', 'Productos')
    store.addPage('list', 'Proveedores')
    active.select(1)

    expect(active.index()).toBe(1)
  })

  it('arranca sin entidad elegida: el inspector no tiene nada que enseñar', () => {
    expect(active.resource()).toBeNull()
  })

  it('recuerda la entidad elegida en el lienzo', () => {
    active.selectResource('producto')

    expect(active.resource()).toBe('producto')
  })

  it('cambiar de vista suelta la entidad: era de la vista anterior', () => {
    store.addPage('list', 'Productos')
    store.addPage('list', 'Proveedores')
    active.selectResource('producto')

    active.select(1)

    expect(active.resource()).toBeNull()
  })

  it('nunca apunta fuera del diseño: al borrar la última vista el índice retrocede', () => {
    store.addPage('list', 'Productos')
    store.addPage('list', 'Proveedores')
    active.select(1)

    store.removePage(1)

    expect(active.index()).toBe(0)
  })
})

describe('ActiveViewService — la columna elegida', () => {
  let active: ActiveViewService
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    active = TestBed.inject(ActiveViewService)
    store = TestBed.inject(DesignStore)
  })

  it('arranca sin columna elegida', () => {
    expect(active.field()).toBeNull()
  })

  it('elegir una columna elige también su entidad: el inspector necesita las dos', () => {
    store.addResource('Producto')
    store.addField('producto')

    active.selectField('producto', 1)

    expect(active.resource()).toBe('producto')
    expect(active.field()).toBe(1)
  })

  it('cambiar de entidad suelta la columna: el índice era de la otra', () => {
    store.addResource('Producto')
    store.addResource('Proveedor')
    active.selectField('producto', 0)

    active.selectResource('proveedor')

    expect(active.field()).toBeNull()
  })

  it('la columna nunca apunta fuera de la entidad: al borrarla el índice se suelta', () => {
    store.addResource('Producto')
    store.addField('producto')
    active.selectField('producto', 1)

    store.removeField('producto', 1)

    expect(active.field()).toBeNull()
  })
})

describe('ActiveViewService — el flujo elegido', () => {
  let active: ActiveViewService
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    active = TestBed.inject(ActiveViewService)
    store = TestBed.inject(DesignStore)
  })

  it('sin flujos no hay flujo elegido', () => {
    expect(active.flow()).toBeNull()
  })

  it('con flujos y sin elección, manda el primero: el lienzo nunca queda en blanco', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlow('Resumen semanal')

    expect(active.flow()).toBe('Aviso de stock bajo')
  })

  it('elegir un flujo lo deja al mando', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlow('Resumen semanal')

    active.selectFlow('Resumen semanal')

    expect(active.flow()).toBe('Resumen semanal')
  })

  it('si el flujo elegido se borra, vuelve al primero que quede', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlow('Resumen semanal')
    active.selectFlow('Resumen semanal')

    store.removeFlow('Resumen semanal')

    expect(active.flow()).toBe('Aviso de stock bajo')
  })

  it('el nodo elegido se suelta al cambiar de flujo: era del otro diagrama', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlow('Resumen semanal')
    active.selectFlowNode('inicio')

    active.selectFlow('Resumen semanal')

    expect(active.flowNode()).toBeNull()
  })

  it('un nodo que ya no existe no se queda elegido', () => {
    store.addFlow('Aviso de stock bajo')
    store.addFlowNode('Aviso de stock bajo', 'step', 'Avisar')
    active.selectFlowNode('avisar')

    store.removeFlowNode('Aviso de stock bajo', 'avisar')

    expect(active.flowNode()).toBeNull()
  })
})
