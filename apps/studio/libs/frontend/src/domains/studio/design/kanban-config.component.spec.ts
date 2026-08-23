import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { chooseInSelect, selectValueLabel } from '../../../shared/components/ui/select.harness'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { KanbanConfigComponent } from './kanban-config.component'

function mount(resource: string | null = 'pedido') {
  const fixture = TestBed.createComponent(KanbanConfigComponent)
  fixture.componentRef.setInput('resource', resource)
  fixture.detectChanges()
  return fixture
}

/** Spec 61 (22F): Columnas / Etiqueta, calcado del panel del calendario. */
describe('KanbanConfigComponent', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
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
    store.addBlock(1, { kind: 'kanban', resource: 'pedido' })
    active.select(1)
    active.selectResource('pedido')
  })

  it('sin bloque kanban en la vista activa no pinta nada', () => {
    active.select(0)
    const fixture = mount()

    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('')
  })

  it('propone el campo de columnas del bloque', async () => {
    const fixture = mount()
    await fixture.whenStable()
    fixture.detectChanges()

    expect(selectValueLabel(fixture, 'kanban-columns')).toBe('Estado')
  })

  it('elegir la etiqueta la replica en la entidad', async () => {
    const fixture = mount()

    await chooseInSelect(fixture, 'kanban-label', 'Nombre')

    expect(store.resources()[0].kanban).toMatchObject({ labelField: 'nombre' })
  })
})
