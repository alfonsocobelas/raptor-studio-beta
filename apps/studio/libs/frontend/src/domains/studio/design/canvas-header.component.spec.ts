import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { CanvasHeaderComponent } from './canvas-header.component'
import { DesignStore } from './design-store'
import { PreviewSettings } from './preview-settings'

function mount() {
  const fixture = TestBed.createComponent(CanvasHeaderComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('CanvasHeaderComponent', () => {
  let store: DesignStore
  let active: ActiveViewService
  let preview: PreviewSettings

  beforeEach(() => {
    TestBed.configureTestingModule({})
    store = TestBed.inject(DesignStore)
    active = TestBed.inject(ActiveViewService)
    preview = TestBed.inject(PreviewSettings)
  })

  it('sin vistas no dice nada: el lienzo ya explica que está vacío', () => {
    const fixture = mount()

    expect(testId(fixture, 'canvas-header')).toBeNull()
  })

  it('nombra la vista que se está dibujando', () => {
    store.addPage('list', 'Productos')
    store.addPage('list', 'Proveedores')
    active.select(1)

    const fixture = mount()

    expect(testId(fixture, 'canvas-header-title')?.textContent).toContain('Proveedores')
  })

  it('el chip de piel dice la piel elegida, con la etiqueta del generador', () => {
    store.addPage('list', 'Productos')
    preview.preset.set('suite')

    const fixture = mount()

    expect(testId(fixture, 'chip-skin')?.textContent).toContain('Suite (ERP)')
  })

  it('el chip de tema dice el tema del catálogo, no un color a mano', () => {
    store.addPage('list', 'Productos')
    preview.palette.set('ocean')

    const fixture = mount()

    expect(testId(fixture, 'chip-theme')?.textContent).toContain('Océano')
  })
})
