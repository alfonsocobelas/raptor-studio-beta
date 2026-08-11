import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { CanvasControlsComponent } from './canvas-controls.component'
import { CanvasViewportService } from './canvas-viewport.service'
import { StudioModeService } from './studio-mode.service'

function mount() {
  const fixture = TestBed.createComponent(CanvasControlsComponent)
  fixture.detectChanges()
  return fixture
}

function testId(fixture: ReturnType<typeof mount>, id: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${id}"]`)
}

describe('CanvasControlsComponent', () => {
  let viewport: CanvasViewportService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    viewport = TestBed.inject(CanvasViewportService)
  })

  it('muestra el zoom en porcentaje', () => {
    const fixture = mount()

    expect(testId(fixture, 'canvas-zoom-level')?.textContent).toContain('100%')
  })

  it('acercar y alejar cambian el zoom del lienzo indicado', () => {
    const fixture = mount()

    testId(fixture, 'canvas-zoom-in')?.click()
    expect(viewport.of('model')().zoom).toBeGreaterThan(1)

    testId(fixture, 'canvas-zoom-out')?.click()
    testId(fixture, 'canvas-zoom-out')?.click()
    expect(viewport.of('model')().zoom).toBeLessThan(1)
  })

  it('pulsar el porcentaje vuelve al 100%', () => {
    const fixture = mount()
    testId(fixture, 'canvas-zoom-in')?.click()

    testId(fixture, 'canvas-zoom-level')?.click()

    expect(viewport.of('model')().zoom).toBe(1)
  })

  it('no toca la cámara del otro lienzo', () => {
    TestBed.inject(StudioModeService).mode.set('flows')
    const fixture = mount()

    testId(fixture, 'canvas-zoom-in')?.click()

    expect(viewport.of('flows')().zoom).toBeGreaterThan(1)
    expect(viewport.of('model')().zoom).toBe(1)
  })
})
