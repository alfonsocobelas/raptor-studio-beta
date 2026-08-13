import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { ModelViewComponent } from './model-view.component'

function mount() {
  const fixture = TestBed.createComponent(ModelViewComponent)
  fixture.detectChanges()
  return fixture
}

function card(fixture: ReturnType<typeof mount>, resource: string): HTMLElement {
  const node = fixture.nativeElement.querySelector(`[data-testid="model-node-${resource}"]`)
  if (!node) throw new Error(`falta la caja de ${resource}`)
  return node as HTMLElement
}

describe('ModelViewComponent', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Producto')
    store.addResource('Cliente')
  })

  it('la entidad elegida lleva borde de marca; las demás, no', () => {
    active.selectResource('producto')

    const fixture = mount()

    expect(card(fixture, 'producto').classList.contains('model-card-chosen')).toBe(true)
    expect(card(fixture, 'cliente').classList.contains('model-card-chosen')).toBe(false)
  })

  it('el puntito de la clave es de marca, no de tinta', () => {
    const fixture = mount()
    const row = fixture.nativeElement.querySelector('[data-testid="model-field-producto-id"]')

    expect(row.querySelector('.model-dot')).not.toBeNull()
    expect(row.querySelector('.bg-foreground\\/70')).toBeNull()
  })

  it('el puntito de una columna que apunta a otra entidad también es de marca', () => {
    store.addResource('Pedido')
    store.addRelation('pedido', 'producto')

    const fixture = mount()
    const row = fixture.nativeElement.querySelector('[data-testid^="model-field-pedido-producto"]')
    if (!row) throw new Error('falta la columna de referencia')

    expect(row.querySelector('.model-dot')).not.toBeNull()
  })

  it('sin entidad elegida ninguna caja lleva borde de marca', () => {
    active.selectResource(null)

    const fixture = mount()

    expect(card(fixture, 'producto').classList.contains('model-card-chosen')).toBe(false)
    expect(card(fixture, 'cliente').classList.contains('model-card-chosen')).toBe(false)
  })
})
