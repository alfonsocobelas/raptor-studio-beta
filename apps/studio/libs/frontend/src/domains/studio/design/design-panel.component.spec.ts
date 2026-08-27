import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ActiveViewService } from './active-view.service'
import { DesignPanelComponent } from './design-panel.component'
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
