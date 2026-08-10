import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { ViewsSidebarComponent } from './views-sidebar.component'

/** Monta el panel con el diseño ya poblado: mismos servicios de raíz que en la app. */
function mount() {
  const fixture = TestBed.createComponent(ViewsSidebarComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('ViewsSidebarComponent', () => {
  let store: DesignStore
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
  })

  it('lista una entrada por vista del diseño, en orden', () => {
    store.addPage('list', 'Productos')
    store.addPage('list', 'Proveedores')

    const fixture = mount()
    const items = fixture.nativeElement.querySelectorAll('[data-testid^="view-item-"]')

    expect(items.length).toBe(2)
    expect(items[0].textContent).toContain('Productos')
    expect(items[1].textContent).toContain('Proveedores')
  })

  it('marca la vista activa, que es la que se está dibujando en el lienzo', () => {
    store.addPage('list', 'Productos')
    store.addPage('list', 'Proveedores')
    active.select(1)

    const fixture = mount()

    expect(testId(fixture, 'view-item-1')?.getAttribute('aria-current')).toBe('true')
    expect(testId(fixture, 'view-item-0')?.getAttribute('aria-current')).toBeNull()
  })

  it('al pulsar una vista pasa a ser la activa', () => {
    store.addPage('list', 'Productos')
    store.addPage('list', 'Proveedores')

    const fixture = mount()
    testId(fixture, 'view-item-1')?.click()

    expect(active.index()).toBe(1)
  })

  it('ofrece los cinco bloques que el generador emite, y ninguno más', () => {
    const fixture = mount()
    const tools = fixture.nativeElement.querySelectorAll('[data-testid^="block-tool-"]')

    expect([...tools].map((tool: Element) => tool.getAttribute('data-testid'))).toEqual([
      'block-tool-table',
      'block-tool-kpis',
      'block-tool-cards',
      'block-tool-attachments',
      'block-tool-fields'
    ])
  })

  it('sin entidades todavía, el menú de un bloque lo dice en vez de ofrecer nada', () => {
    store.addPage('blank', 'Portada')

    const fixture = mount()
    testId(fixture, 'block-tool-table')?.click()
    fixture.detectChanges()

    expect(testId(fixture, 'block-menu-empty')).not.toBeNull()
  })

  it('con una entidad, elegirla añade el bloque a la vista activa', () => {
    store.addPage('list', 'Productos')

    const fixture = mount()
    testId(fixture, 'block-tool-kpis')?.click()
    fixture.detectChanges()
    testId(fixture, 'add-kpis-producto')?.click()
    fixture.detectChanges()

    expect(store.pages()[0].blocks.some(block => block.kind === 'kpis')).toBe(true)
  })

  it('la vista recién creada queda seleccionada', async () => {
    store.addPage('list', 'Productos')

    const fixture = mount()
    testId(fixture, 'tool-new-view')?.click()
    fixture.detectChanges()
    testId(fixture, 'preset-list')?.click()
    fixture.detectChanges()
    const input = testId(fixture, 'new-page-title') as HTMLInputElement
    input.value = 'Proveedores'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    // ngModel escribe en el signal en un microtask: sin ceder aquí el título llega vacío
    await Promise.resolve()
    fixture.detectChanges()
    testId(fixture, 'new-page-ok')?.click()
    fixture.detectChanges()

    expect(store.pages().map(page => page.title)).toEqual(['Productos', 'Proveedores'])
    expect(active.index()).toBe(1)
  })
})
