import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { EntityDraftService } from './entity-draft.service'
import { ModelSidebarComponent } from './model-sidebar.component'

function mount() {
  const fixture = TestBed.createComponent(ModelSidebarComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('ModelSidebarComponent', () => {
  let store: DesignStore
  let active: ActiveViewService
  let draft: EntityDraftService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    draft = TestBed.inject(EntityDraftService)
  })

  it('ofrece añadir entidad y campo, que es lo que el diseño sabe hacer', () => {
    const fixture = mount()

    expect(testId(fixture, 'model-add-entity')).not.toBeNull()
    expect(testId(fixture, 'model-add-field')).not.toBeNull()
  })

  it('sin entidad elegida no se puede añadir un campo, y lo dice', () => {
    store.addResource('Productos')

    const fixture = mount()

    expect((testId(fixture, 'model-add-field') as HTMLButtonElement).disabled).toBe(true)
    expect(testId(fixture, 'model-add-hint')?.textContent).toContain('Selecciona una entidad')
  })

  it('con una entidad elegida nombra a quién se le añade el campo', () => {
    store.addResource('Productos')
    active.selectResource('producto')

    const fixture = mount()

    expect(testId(fixture, 'model-add-hint')?.textContent).toContain('producto')
  })

  it('añadir campo se lo pone a la entidad elegida, no a otra', () => {
    store.addResource('Productos')
    store.addResource('Proveedores')
    active.selectResource('proveedor')
    const antes = store.resources().find(r => r.name === 'proveedor')?.fields.length ?? 0

    const fixture = mount()
    testId(fixture, 'model-add-field')?.click()

    expect(store.resources().find(r => r.name === 'proveedor')?.fields.length).toBe(antes + 1)
    expect(store.resources().find(r => r.name === 'producto')?.fields.length).toBe(antes)
  })

  it('el botón no pide el nombre en el raíl: abre el alta en el lienzo', () => {
    const fixture = mount()

    testId(fixture, 'model-add-entity')?.click()
    fixture.detectChanges()

    expect(draft.pending()).toBe(true)
    // el raíl no se transforma: el botón sigue donde estaba
    expect(testId(fixture, 'model-add-entity')).not.toBeNull()
    expect(testId(fixture, 'model-new-entity-name')).toBeNull()
  })

  it('la tecla E abre el alta de entidad, como anuncia su atajo', () => {
    mount()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true }))

    expect(draft.pending()).toBe(true)
  })

  it('la tecla C añade un campo a la entidad elegida', () => {
    store.addResource('Productos')
    active.selectResource('producto')
    const antes = store.resources()[0].fields.length

    const fixture = mount()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }))

    expect(store.resources()[0].fields.length).toBe(antes + 1)
  })

  it('escribiendo en un campo de texto los atajos no disparan: sería un sabotaje', () => {
    store.addResource('Productos')
    active.selectResource('producto')
    const antes = store.resources()[0].fields.length

    const fixture = mount()
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }))
    input.remove()

    expect(store.resources()[0].fields.length).toBe(antes)
  })

  it('explica que las relaciones se arrastran, en vez de ofrecer un botón que no las crea', () => {
    const fixture = mount()

    expect(testId(fixture, 'model-relation-hint')?.textContent).toContain('arrastra')
    expect(testId(fixture, 'model-add-relation')).toBeNull()
  })
})
