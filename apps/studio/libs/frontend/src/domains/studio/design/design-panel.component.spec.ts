import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignPanelComponent } from './design-panel.component'
import { DesignStore } from './design-store'
import { PreviewSettings } from './preview-settings'

function mount() {
  const fixture = TestBed.createComponent(DesignPanelComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('DesignPanelComponent', () => {
  let preview: PreviewSettings
  let active: ActiveViewService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    preview = TestBed.inject(PreviewSettings)
    active = TestBed.inject(ActiveViewService)
  })

  it('tiene tres pestañas: el tema, la piel y el bloque elegido', () => {
    const fixture = mount()
    const tabs = fixture.nativeElement.querySelectorAll('[data-testid^="panel-tab-"]')

    expect([...tabs].map((tab: Element) => tab.textContent?.trim())).toEqual(['Tema', 'Piel', 'Componente'])
  })

  it('abre en Tema y ofrece los temas del catálogo, no una lista escrita a mano', () => {
    const fixture = mount()
    const themes = fixture.nativeElement.querySelectorAll('[data-testid^="palette-"]')

    expect(themes.length).toBeGreaterThan(1)
    expect(testId(fixture, 'palette-neutral')).not.toBeNull()
  })

  it('elegir un tema lo aplica a la app dibujada', () => {
    const fixture = mount()
    testId(fixture, 'palette-ocean')?.click()

    expect(preview.palette()).toBe('ocean')
  })

  it('el modo de la app se cambia desde el panel, no desde la barra', () => {
    const fixture = mount()
    testId(fixture, 'preview-mode-dark')?.click()

    expect(preview.theme()).toBe('dark')
  })

  it('la piel vive en su pestaña y aplica el preset del generador', () => {
    const fixture = mount()
    testId(fixture, 'panel-tab-skin')?.click()
    fixture.detectChanges()
    testId(fixture, 'preview-preset-actual')?.click()

    expect(preview.preset()).toBe('actual')
  })

  it('sin nada elegido, la pestaña de componente lo dice en vez de quedarse vacía', () => {
    const fixture = mount()
    testId(fixture, 'panel-tab-component')?.click()
    fixture.detectChanges()

    expect(testId(fixture, 'component-empty')).not.toBeNull()
  })

  it('elegir un bloque en el lienzo trae el panel a su pestaña', () => {
    const fixture = mount()
    active.selectResource('producto')
    fixture.detectChanges()

    expect(testId(fixture, 'panel-tab-component')?.getAttribute('aria-selected')).toBe('true')
  })
})

/**
 * El inspector edita las COLUMNAS de la entidad, así que solo tiene sentido donde la vista
 * las pinta (tabla, galería, ficha, formulario). En un panel ofrecía configurar la tabla de
 * una vista que no tiene tabla (reportado 2026-08-27: «¿por qué aparece Inmueble · columnas?»).
 */
describe('DesignPanelComponent — el inspector solo donde las columnas pintan algo', () => {
  let active: ActiveViewService
  let store: DesignStore

  beforeEach(() => {
    TestBed.configureTestingModule({})
    active = TestBed.inject(ActiveViewService)
    store = TestBed.inject(DesignStore)
    store.addResource('Inmueble')
  })

  const openComponentTab = (fixture: ReturnType<typeof mount>): void => {
    testId(fixture, 'panel-tab-component')?.click()
    fixture.detectChanges()
  }

  it('en una vista con tabla enseña las columnas', () => {
    store.addPage('blank', 'Inmuebles')
    store.addBlock(0, { kind: 'table', resource: 'inmueble' })
    active.selectResource('inmueble')

    const fixture = mount()
    openComponentTab(fixture)

    expect(fixture.nativeElement.textContent).toContain('Inmueble · columnas')
  })

  it('en un panel NO enseña las columnas, y sí la config del bloque', () => {
    store.addPage('blank', 'Panel')
    store.addBlock(0, { kind: 'kpi', resource: 'inmueble' })
    active.selectResource('inmueble')

    const fixture = mount()
    openComponentTab(fixture)

    expect(fixture.nativeElement.textContent).not.toContain('Inmueble · columnas')
    expect(testId(fixture, 'kpi-config')).not.toBeNull()
  })

  it('en un panel sin bloque configurable dice por qué está vacío, en vez de quedarse en blanco', () => {
    store.addPage('blank', 'Panel')
    store.addBlock(0, { kind: 'kpis', resources: ['inmueble'] })
    active.selectResource('inmueble')

    const fixture = mount()
    openComponentTab(fixture)

    expect(testId(fixture, 'component-no-columns')).not.toBeNull()
    expect(fixture.nativeElement.textContent).not.toContain('Inmueble · columnas')
  })

  it('la galería y el formulario también pintan columnas', () => {
    store.addPage('blank', 'Cartera')
    store.addBlock(0, { kind: 'cards', resource: 'inmueble' })
    active.selectResource('inmueble')

    const fixture = mount()
    openComponentTab(fixture)

    expect(fixture.nativeElement.textContent).toContain('Inmueble · columnas')
  })
})
