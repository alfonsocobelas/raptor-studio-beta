import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import type { DesignBlock } from '@app/shared/domain'
import { CanvasKanbanComponent } from './canvas-kanban.component'
import { DesignStore } from './design-store'

function mount(block: DesignBlock) {
  const fixture = TestBed.createComponent(CanvasKanbanComponent)
  fixture.componentRef.setInput('block', block)
  fixture.detectChanges()
  return fixture
}

/** Spec 61 (22F): columnas por valor del enum con tarjetas de muestra. */
describe('CanvasKanbanComponent', () => {
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    store.addResource('Pedido')
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
  })

  const block = (extra: Partial<DesignBlock> = {}): DesignBlock => ({
    kind: 'kanban',
    resource: 'pedido',
    columnsField: 'estado',
    ...extra
  })

  it('pinta una columna por valor del enum con su etiqueta', () => {
    const fixture = mount(block())
    const text = (fixture.nativeElement as HTMLElement).textContent ?? ''

    expect(text).toContain('Pendiente')
    expect(text).toContain('Entregado')
  })

  it('reparte tarjetas de muestra por las columnas', () => {
    const fixture = mount(block())
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid^="kanban-card-"]')

    expect(cards.length).toBeGreaterThan(2)
  })

  it('el pie nombra la entidad y el campo de columnas', () => {
    const fixture = mount(block())
    const text = (fixture.nativeElement as HTMLElement).textContent ?? ''

    expect(text).toContain('Pedidos')
    expect(text).toContain('columnas por Estado')
  })
})
