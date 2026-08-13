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

  it('sin entidad elegida ninguna caja lleva borde de marca', () => {
    active.selectResource(null)

    const fixture = mount()

    expect(card(fixture, 'producto').classList.contains('model-card-chosen')).toBe(false)
    expect(card(fixture, 'cliente').classList.contains('model-card-chosen')).toBe(false)
  })
})
