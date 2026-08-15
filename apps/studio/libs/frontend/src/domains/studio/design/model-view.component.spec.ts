import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { EntityDraftService } from './entity-draft.service'
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
  let draft: EntityDraftService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    draft = TestBed.inject(EntityDraftService)
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
it('el alta pendiente dibuja una caja fantasma con el nombre en edición', () => {
    draft.start()

    const fixture = mount()

    expect(fixture.nativeElement.querySelector('[data-testid=\'model-draft-node\']')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']')).not.toBeNull()
  })

  it('confirmar el nombre crea la entidad, la deja elegida y cierra el alta', () => {
    draft.start()
    const fixture = mount()
    const input = fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']') as HTMLInputElement
    input.value = 'Movimientos'
    input.dispatchEvent(new Event('input'))
    input.closest('form')?.dispatchEvent(new Event('submit'))
    fixture.detectChanges()

    expect(store.resources().map(r => r.name)).toContain('movimiento')
    expect(active.resource()).toBe('movimiento')
    expect(draft.pending()).toBe(false)
    expect(fixture.nativeElement.querySelector('[data-testid=\'model-draft-node\']')).toBeNull()
  })

  it('escapar descarta la caja fantasma sin crear nada', () => {
    draft.start()
    const fixture = mount()
    const antes = store.resources().length
    const input = fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']') as HTMLInputElement
    input.value = 'Movimientos'
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    fixture.detectChanges()

    expect(store.resources().length).toBe(antes)
    expect(draft.pending()).toBe(false)
  })

  it('un nombre vacío no crea nada: cierra el alta y ya', () => {
    draft.start()
    const fixture = mount()
    const input = fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']') as HTMLInputElement
    input.closest('form')?.dispatchEvent(new Event('submit'))
    fixture.detectChanges()

    expect(store.resources().map(r => r.name)).toEqual(['producto', 'cliente'])
    expect(draft.pending()).toBe(false)
  })

  it('un nombre repetido deja el alta abierta: el diseño no admite dos', () => {
    draft.start()
    const fixture = mount()
    const input = fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']') as HTMLInputElement
    input.value = 'Producto'
    input.dispatchEvent(new Event('input'))
    input.closest('form')?.dispatchEvent(new Event('submit'))
    fixture.detectChanges()

    expect(store.resources().length).toBe(2)
    expect(draft.pending()).toBe(true)
  })

  it('sin entidades, el alta pendiente enseña el lienzo y no el cartel de vacío', () => {
    TestBed.resetTestingModule()
    TestBed.configureTestingModule({})
    const vacio = TestBed.inject(DesignStore)
    TestBed.inject(EntityDraftService).start()

    const fixture = mount()

    expect(vacio.resources()).toEqual([])
    expect(fixture.nativeElement.querySelector('[data-testid=\'empty-model\']')).toBeNull()
    expect(fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']')).not.toBeNull()
  })

  it('doble clic en el lienzo abre el alta justo donde se ha picado', () => {
    const fixture = mount()
    const viewport = fixture.nativeElement.querySelector('[data-testid="model-viewport"]') as HTMLElement
    viewport.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: 400, clientY: 300 }))
    fixture.detectChanges()

    const ghost = fixture.nativeElement.querySelector('[data-testid="model-draft-node"]') as HTMLElement
    expect(draft.pending()).toBe(true)
    // centrada en el puntero: la caja nace bajo la mano, no a un lado
    expect(ghost.style.left).toBe('280px')
    expect(ghost.style.top).toBe('280px')
  })

  it('doble clic sobre una caja no crea otra: ahí se está editando, no creando', () => {
    const fixture = mount()
    card(fixture, 'producto').dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: 10, clientY: 10 }))
    fixture.detectChanges()

    expect(draft.pending()).toBe(false)
  })
})

/**
 * Spec 43: la máquina de estados se pinta en la vista del modelo cuando la entidad
 * elegida la declara — solo lectura en esta fase; los gestos llegan aparte.
 */
describe('ModelViewComponent — el diagrama de estados (spec 43)', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    store.promoteState('solicitud', 'nombre')
  })

  it('con la entidad de la máquina elegida, el ciclo de vida aparece', () => {
    active.selectResource('solicitud')

    const fixture = mount()

    expect(fixture.nativeElement.querySelector('[data-testid="state-diagram"]')).not.toBeNull()
  })

  it('sin entidad elegida (o sin máquina) no hay diagrama de estados', () => {
    const fixture = mount()
    expect(fixture.nativeElement.querySelector('[data-testid="state-diagram"]')).toBeNull()

    store.addResource('Cliente')
    active.selectResource('cliente')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('[data-testid="state-diagram"]')).toBeNull()
  })

  it('pinta un nodo por valor, el inicial distinguido y las etiquetas humanas', () => {
    active.selectResource('solicitud')

    const fixture = mount()
    const nodes = fixture.nativeElement.querySelectorAll('[data-testid^="state-node-"]')

    expect(nodes.length).toBe(store.resources()[0].fields[0].values?.length)
    expect(fixture.nativeElement.querySelector('[data-testid="state-initial"]')).not.toBeNull()
  })
})
