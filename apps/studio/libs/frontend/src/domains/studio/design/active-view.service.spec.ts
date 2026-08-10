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

  it('nunca apunta fuera del diseño: al borrar la última vista el índice retrocede', () => {
    store.addPage('list', 'Productos')
    store.addPage('list', 'Proveedores')
    active.select(1)

    store.removePage(1)

    expect(active.index()).toBe(0)
  })
})
