import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { EntityDraftService } from './entity-draft.service'
import { LifecycleUiService } from './lifecycle-ui.service'
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

  /** El diálogo de la oferta es el de la app (spartan), no el confirm del navegador. */
  function offerButton(kind: 'action' | 'cancel'): HTMLButtonElement | null {
    return document.querySelector(`button[hlmalertdialog${kind}]`)
  }

  it('al confirmar se ofrece la vista de listado en un diálogo: con el sí, nace con su tabla', () => {
    draft.start()
    const fixture = mount()
    const input = fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']') as HTMLInputElement
    input.value = 'Movimientos'
    input.dispatchEvent(new Event('input'))
    input.closest('form')?.dispatchEvent(new Event('submit'))
    fixture.detectChanges()

    const action = offerButton('action')
    expect(action).not.toBeNull()
    action?.click()
    fixture.detectChanges()

    expect(store.pages().at(-1)).toEqual({
      title: 'Movimientos',
      blocks: [{ kind: 'table', resource: 'movimiento', width: 'full' }]
    })
  })

  it('con el no, la entidad queda suelta: sin vista nueva', async () => {
    draft.start()
    const fixture = mount()
    const antes = store.pages().length
    const input = fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']') as HTMLInputElement
    input.value = 'Movimientos'
    input.dispatchEvent(new Event('input'))
    input.closest('form')?.dispatchEvent(new Event('submit'))
    fixture.detectChanges()

    offerButton('cancel')?.click()
    fixture.detectChanges()
    // el overlay se desmonta en asíncrono: se espera a que el cierre termine
    await fixture.whenStable()

    expect(store.resources().map(r => r.name)).toContain('movimiento')
    expect(store.pages().length).toBe(antes)
    expect(offerButton('action')).toBeNull()
  })

  it('picar fuera con nombre escrito confirma el alta: el blur vale lo que el Enter', () => {
    draft.start()
    const fixture = mount()
    const input = fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']') as HTMLInputElement
    input.value = 'Movimientos'
    input.dispatchEvent(new Event('input'))
    input.dispatchEvent(new Event('blur'))
    fixture.detectChanges()

    expect(store.resources().map(r => r.name)).toContain('movimiento')
    expect(draft.pending()).toBe(false)
  })

  it('picar fuera sin nombre descarta la caja fantasma', () => {
    draft.start()
    const fixture = mount()
    const antes = store.resources().length
    const input = fixture.nativeElement.querySelector('[data-testid=\'model-draft-name\']') as HTMLInputElement
    input.dispatchEvent(new Event('blur'))
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
 * El ciclo de vida deja la capa fija (desbordaba el lienzo con máquinas grandes y tapaba
 * las cajas): el diagrama entero se edita en una sub-vista a lienzo completo con pan/zoom,
 * como Flujos. La card que la abre vive en el panel derecho (pestaña Entidad), así que el
 * lienzo solo conoce el estado abierto/cerrado a través del servicio.
 */
describe('ModelViewComponent — la sub-vista del ciclo de vida', () => {
  let store: DesignStore
  let active: ActiveViewService
  let lifecycle: LifecycleUiService

  function query(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
  }

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    lifecycle = TestBed.inject(LifecycleUiService)
    store.addResource('Solicitud')
    store.updateField('solicitud', 0, { type: 'enum' })
    store.promoteState('solicitud', 'nombre')
    active.selectResource('solicitud')
  })

  it('el lienzo del modelo ya no incrusta ni el diagrama ni ninguna card flotante', () => {
    const fixture = mount()

    expect(query(fixture, 'state-diagram')).toBeNull()
    expect(query(fixture, 'lifecycle-summary')).toBeNull()
    expect(query(fixture, 'model-node-solicitud')).not.toBeNull()
  })

  it('con la sub-vista abierta, el diagrama editable ocupa el lienzo entero', () => {
    const fixture = mount()
    lifecycle.open.set(true)
    fixture.detectChanges()

    expect(query(fixture, 'lifecycle-view')).not.toBeNull()
    expect(query(fixture, 'state-diagram')).not.toBeNull()
    const nodes = fixture.nativeElement.querySelectorAll('[data-testid^="state-node-"]')
    expect(nodes.length).toBe(store.resources()[0].fields[0].values?.length)
    expect(query(fixture, 'state-initial')).not.toBeNull()
    // el lienzo de entidades descansa mientras se edita el ciclo
    expect(query(fixture, 'model-node-solicitud')).toBeNull()
  })

  it('«Volver al modelo» cierra la sub-vista y devuelve las cajas', () => {
    const fixture = mount()
    lifecycle.open.set(true)
    fixture.detectChanges()
    query(fixture, 'lifecycle-back')?.click()
    fixture.detectChanges()

    expect(query(fixture, 'lifecycle-view')).toBeNull()
    expect(query(fixture, 'model-node-solicitud')).not.toBeNull()
  })

  it('elegir otra entidad cierra la sub-vista: el ciclo abierto era de la anterior', () => {
    store.addResource('Pedido')
    store.updateField('pedido', 0, { type: 'enum' })
    store.promoteState('pedido', 'nombre')

    const fixture = mount()
    lifecycle.open.set(true)
    fixture.detectChanges()
    active.selectResource('pedido')
    fixture.detectChanges()

    expect(query(fixture, 'lifecycle-view')).toBeNull()
    expect(query(fixture, 'model-node-pedido')).not.toBeNull()
  })
})

/**
 * Resaltar la vecindad de la entidad elegida (2026-08-28): elegirla no solo tiñe su
 * cabecera — también se encienden sus flechas y las cajas al otro extremo, que es lo
 * que hace legible «con qué se relaciona esto» de un vistazo.
 */
describe('ModelViewComponent — la vecindad de la entidad elegida', () => {
  let store: DesignStore
  let active: ActiveViewService

  function query(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
  }

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    store.addResource('Producto')
    store.addResource('Cliente')
  })

  it('las entidades relacionadas con la elegida se resaltan; las ajenas, no', () => {
    store.addResource('Pedido')
    store.addRelation('pedido', 'producto')
    active.selectResource('pedido')

    const fixture = mount()

    expect(card(fixture, 'producto').classList.contains('model-card-related')).toBe(true)
    expect(card(fixture, 'cliente').classList.contains('model-card-related')).toBe(false)
    // la elegida no es «relacionada» de sí misma: ya viste de tinta
    expect(card(fixture, 'pedido').classList.contains('model-card-related')).toBe(false)
  })

  it('la relación se resalta en los dos sentidos: elegir el destino marca el origen', () => {
    store.addResource('Pedido')
    store.addRelation('pedido', 'producto')
    active.selectResource('producto')

    const fixture = mount()

    expect(card(fixture, 'pedido').classList.contains('model-card-related')).toBe(true)
    expect(card(fixture, 'cliente').classList.contains('model-card-related')).toBe(false)
  })

  it('la flecha que toca a la elegida se pinta de marca', () => {
    store.addResource('Pedido')
    store.addRelation('pedido', 'producto')
    store.addRelation('cliente', 'producto')
    active.selectResource('pedido')

    const fixture = mount()
    const tocada = query(fixture, 'edge-pedido-producto')
    const ajena = query(fixture, 'edge-cliente-producto')

    expect(tocada?.querySelector('.model-edge-related')).not.toBeNull()
    expect(ajena?.querySelector('.model-edge-related')).toBeNull()
  })

  it('sin entidad elegida no hay ni cajas relacionadas ni flechas de marca', () => {
    store.addResource('Pedido')
    store.addRelation('pedido', 'producto')
    active.selectResource(null)

    const fixture = mount()

    expect(card(fixture, 'producto').classList.contains('model-card-related')).toBe(false)
    expect(query(fixture, 'edge-pedido-producto')?.querySelector('.model-edge-related')).toBeNull()
  })
})
