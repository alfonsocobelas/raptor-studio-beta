import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { BlockDragService } from './block-drag.service'
import { CanvasNoticeService } from './canvas-notice.service'
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

  it('la ficha cuelga de su listado: va detrás de él y sangrada', () => {
    store.addPage('list', 'Instalaciones')
    store.addPage('list', 'Productos')
    // un bloque de detalle sobre la entidad del primer listado crea su ficha, al final del diseño
    store.addBlock(0, { kind: 'fields', resource: 'instalacion' })
    const ficha = store.pages().find(page => page.drillDown)?.title

    const fixture = mount()
    const items = [...fixture.nativeElement.querySelectorAll('[data-testid^="view-item-"]')] as HTMLElement[]

    expect(items.map(item => item.textContent?.trim())).toEqual(['Instalaciones', ficha, 'Productos'])
    expect(items[1].getAttribute('data-child')).toBe('true')
    expect(items[0].getAttribute('data-child')).toBeNull()
  })

  it('un panel de KPIs no adopta fichas aunque vaya primero: la madre es el listado que las abre', () => {
    // el orden real de un diseño: el panel arriba, mencionando por KPIs todas las entidades
    store.addPage('list', 'Instalaciones')
    store.addPage('list', 'Productos')
    store.addPage('panel', 'Resumen')
    store.addBlock(2, { kind: 'kpis', resources: ['instalacion', 'producto'] })
    store.movePage(2, 0)
    store.addBlock(1, { kind: 'fields', resource: 'instalacion' })
    store.addBlock(2, { kind: 'fields', resource: 'producto' })

    active.select(1) // Instalaciones: su ficha se despliega, la de Productos sigue plegada

    const fixture = mount()
    const items = [...fixture.nativeElement.querySelectorAll('[data-testid^="view-item-"]')] as HTMLElement[]
    const shape = items.map(item => ({ text: item.textContent?.trim(), child: item.getAttribute('data-child') }))

    expect(shape).toEqual([
      { text: 'Resumen', child: null },
      { text: 'Instalaciones', child: null },
      { text: expect.stringContaining('Ficha de instalac'), child: 'true' },
      { text: 'Productos', child: null }
    ])
  })

  it('las fichas van plegadas: solo se ven las de la vista activa', () => {
    store.addPage('list', 'Instalaciones')
    store.addPage('list', 'Productos')
    store.addBlock(0, { kind: 'fields', resource: 'instalacion' })
    store.addBlock(1, { kind: 'fields', resource: 'producto' })
    active.select(0)

    const fixture = mount()
    const visible = [...fixture.nativeElement.querySelectorAll('[data-testid^="view-item-"]')] as HTMLElement[]

    expect(visible.map(item => item.textContent?.trim())).toEqual([
      'Instalaciones',
      expect.stringContaining('Ficha de instalac'),
      'Productos'
    ])
  })

  it('la ficha abierta no se pliega bajo sus propios pies', () => {
    store.addPage('list', 'Instalaciones')
    store.addBlock(0, { kind: 'fields', resource: 'instalacion' })
    const ficha = store.pages().findIndex(page => page.drillDown)
    active.select(ficha)

    const fixture = mount()

    expect(testId(fixture, `view-item-${ficha}`)).not.toBeNull()
  })

  it('la vista con fichas se marca como desplegable, la que no las tiene no', () => {
    store.addPage('list', 'Instalaciones')
    store.addPage('list', 'Productos')
    store.addBlock(0, { kind: 'fields', resource: 'instalacion' })
    active.select(1)

    const fixture = mount()

    // Instalaciones tiene ficha y está plegada; Productos no tiene nada que desplegar
    expect(testId(fixture, 'view-item-0')?.getAttribute('aria-expanded')).toBe('false')
    expect(testId(fixture, 'view-item-1')?.getAttribute('aria-expanded')).toBeNull()
  })

  it('la ficha sigue seleccionando su propia vista, no la de al lado', () => {
    store.addPage('list', 'Instalaciones')
    store.addPage('list', 'Productos')
    store.addBlock(0, { kind: 'fields', resource: 'instalacion' })
    const fichaIndex = store.pages().findIndex(page => page.drillDown)

    const fixture = mount()
    const items = [...fixture.nativeElement.querySelectorAll('[data-testid^="view-item-"]')] as HTMLElement[]
    items[1].click()

    expect(active.index()).toBe(fichaIndex)
  })

  it('un clic fuera cierra el desplegable de nueva vista', () => {
    const fixture = mount()
    testId(fixture, 'tool-new-view')?.click()
    fixture.detectChanges()
    expect(testId(fixture, 'preset-list')).not.toBeNull()

    document.body.click()
    fixture.detectChanges()

    expect(testId(fixture, 'preset-list')).toBeNull()
  })

  it('un clic dentro del desplegable no lo cierra', () => {
    const fixture = mount()
    testId(fixture, 'tool-new-view')?.click()
    fixture.detectChanges()

    testId(fixture, 'view-menu')?.click()
    fixture.detectChanges()

    expect(testId(fixture, 'preset-list')).not.toBeNull()
  })

  it('Escape cierra el desplegable sin tocar el diseño', () => {
    const fixture = mount()
    testId(fixture, 'tool-new-view')?.click()
    fixture.detectChanges()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    fixture.detectChanges()

    expect(testId(fixture, 'preset-list')).toBeNull()
    expect(store.pages()).toEqual([])
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

  it('sin entidades todavía no hay nada que arrastrar: el componente queda deshabilitado', () => {
    store.addPage('blank', 'Portada')

    const fixture = mount()

    expect((testId(fixture, 'block-tool-table') as HTMLButtonElement).disabled).toBe(true)
  })

  it('los componentes se arrastran', () => {
    store.addPage('list', 'Productos')

    const fixture = mount()

    expect(testId(fixture, 'block-tool-table')?.getAttribute('draggable')).toBe('true')
  })

  it('arrastrar un componente anuncia su tipo, y soltarlo fuera lo olvida', () => {
    store.addPage('list', 'Productos')
    const drag = TestBed.inject(BlockDragService)

    const fixture = mount()
    testId(fixture, 'block-tool-kpis')?.dispatchEvent(new Event('dragstart', { bubbles: true }))
    expect(drag.kind()).toBe('kpis')

    testId(fixture, 'block-tool-kpis')?.dispatchEvent(new Event('dragend', { bubbles: true }))
    expect(drag.kind()).toBeNull()
  })

  it('sin arrastrar, un clic añade el bloque a la vista activa con su entidad — ya no hay selector', () => {
    store.addPage('list', 'Productos')

    const fixture = mount()
    testId(fixture, 'block-tool-kpis')?.click()
    fixture.detectChanges()

    expect(store.pages()[0].blocks.at(-1)).toMatchObject({ kind: 'kpis', resources: ['producto'] })
    expect(testId(fixture, 'add-kpis-producto')).toBeNull()
  })

  it('un bloque de ficha no te mueve de vista: el lienzo se queda donde estás', () => {
    store.addPage('list', 'Productos')

    const fixture = mount()
    testId(fixture, 'block-tool-attachments')?.click()
    fixture.detectChanges()

    expect(active.index()).toBe(0)
    expect(store.pages()[1]?.drillDown).toBe(true)
  })

  it('…pero lo dice, y ofrece ir a verlo', () => {
    store.addPage('list', 'Productos')
    const notice = TestBed.inject(CanvasNoticeService)

    const fixture = mount()
    testId(fixture, 'block-tool-attachments')?.click()
    fixture.detectChanges()

    expect(notice.notice()?.text).toContain('ficha')
    notice.notice()?.action?.run()
    expect(active.index()).toBe(1)
  })

  it('cuando el gate rechaza el bloque, el aviso cuenta por qué en vez de callar', () => {
    store.addPage('panel', 'Productos')
    const notice = TestBed.inject(CanvasNoticeService)

    const fixture = mount()
    testId(fixture, 'block-tool-kpis')?.click() // ya hay KPIs de esa entidad: widget duplicado
    fixture.detectChanges()

    expect(store.pages()[0].blocks.filter(block => block.kind === 'kpis').length).toBe(1)
    expect(notice.notice()?.text).toContain('duplicated widget')
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
