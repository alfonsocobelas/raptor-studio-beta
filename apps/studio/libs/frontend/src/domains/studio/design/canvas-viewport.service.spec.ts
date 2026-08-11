import { beforeEach, describe, expect, it } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { ZOOM_LIMITS } from '@app/shared/domain'
import { CanvasViewportService } from './canvas-viewport.service'

describe('CanvasViewportService', () => {
  let viewport: CanvasViewportService

  beforeEach(() => {
    TestBed.configureTestingModule({})
    viewport = TestBed.inject(CanvasViewportService)
  })

  it('cada lienzo tiene su cámara: mover el modelo no mueve los flujos', () => {
    viewport.panBy('model', { x: 100, y: 50 })

    expect(viewport.of('model')().pan).toEqual({ x: 100, y: 50 })
    expect(viewport.of('flows')().pan).toEqual({ x: 0, y: 0 })
  })

  it('arranca al 100% y sin desplazar', () => {
    expect(viewport.of('model')()).toEqual({ pan: { x: 0, y: 0 }, zoom: 1 })
  })

  it('acumula el desplazamiento', () => {
    viewport.panBy('model', { x: 10, y: 10 })
    viewport.panBy('model', { x: -30, y: 5 })

    expect(viewport.of('model')().pan).toEqual({ x: -20, y: 15 })
  })

  it('el zoom se ancla al punto indicado y respeta los topes', () => {
    viewport.zoomBy('model', 1.5, { x: 200, y: 200 })
    const tras = viewport.of('model')()

    expect(tras.zoom).toBe(1.5)
    expect(tras.pan).toEqual({ x: -100, y: -100 })

    viewport.zoomBy('model', 99, { x: 0, y: 0 })
    expect(viewport.of('model')().zoom).toBe(ZOOM_LIMITS.max)
  })

  it('volver al 100% deja el zoom en 1 sin tocar el desplazamiento', () => {
    viewport.panBy('model', { x: 40, y: 40 })
    viewport.zoomBy('model', 2, { x: 0, y: 0 })

    viewport.resetZoom('model')

    expect(viewport.of('model')().zoom).toBe(1)
  })

  it('ajustar al contenido encaja y centra lo dibujado', () => {
    viewport.fit('model', [{ x: 0, y: 0, width: 2000, height: 1200 }], { width: 1000, height: 800 })

    expect(viewport.of('model')().zoom).toBeLessThan(1)
  })
})
