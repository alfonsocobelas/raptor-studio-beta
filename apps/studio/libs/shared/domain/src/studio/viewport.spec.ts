import { describe, expect, it } from 'vitest'
import type { NodeBox } from './model-diagram'
import {
  ZOOM_LIMITS,
  clampZoom,
  fitToContent,
  screenToWorld,
  worldToScreen,
  zoomAt,
  type Viewport
} from './viewport'

const inicio: Viewport = { pan: { x: 0, y: 0 }, zoom: 1 }

describe('clampZoom', () => {
  it('no baja del mínimo ni sube del máximo', () => {
    expect(clampZoom(0.01)).toBe(ZOOM_LIMITS.min)
    expect(clampZoom(99)).toBe(ZOOM_LIMITS.max)
    expect(clampZoom(1.25)).toBe(1.25)
  })
})

describe('screenToWorld / worldToScreen', () => {
  it('son inversas: ida y vuelta devuelve el mismo punto', () => {
    const viewport: Viewport = { pan: { x: -120, y: 45 }, zoom: 1.5 }
    const punto = { x: 340, y: 210 }

    expect(worldToScreen(screenToWorld(punto, viewport), viewport)).toEqual(punto)
  })

  it('sin pan ni zoom, pantalla y mundo son lo mismo', () => {
    expect(screenToWorld({ x: 10, y: 20 }, inicio)).toEqual({ x: 10, y: 20 })
  })
})

describe('zoomAt — el zoom no mueve lo que hay bajo el cursor', () => {
  it('el punto del cursor sigue apuntando al mismo lugar del mundo', () => {
    const cursor = { x: 500, y: 300 }
    const antes = screenToWorld(cursor, inicio)

    const despues = zoomAt(inicio, 1.6, cursor)

    const mundoDespues = screenToWorld(cursor, despues)
    expect(mundoDespues.x).toBeCloseTo(antes.x, 6)
    expect(mundoDespues.y).toBeCloseTo(antes.y, 6)
  })

  it('funciona igual alejando', () => {
    const partida: Viewport = { pan: { x: -200, y: -80 }, zoom: 1.8 }
    const cursor = { x: 640, y: 400 }
    const antes = screenToWorld(cursor, partida)

    const despues = zoomAt(partida, 0.5, cursor)

    const mundoDespues = screenToWorld(cursor, despues)
    expect(mundoDespues.x).toBeCloseTo(antes.x, 6)
    expect(mundoDespues.y).toBeCloseTo(antes.y, 6)
  })

  it('respeta los límites de zoom sin desplazar el punto de forma incoherente', () => {
    const tope = zoomAt({ pan: { x: 0, y: 0 }, zoom: ZOOM_LIMITS.max }, 4, { x: 100, y: 100 })

    expect(tope.zoom).toBe(ZOOM_LIMITS.max)
    expect(tope.pan).toEqual({ x: 0, y: 0 })
  })
})

describe('fitToContent — encajar el dibujo en el viewport', () => {
  const caja = (x: number, y: number, w = 240, h = 120): NodeBox => ({ x, y, width: w, height: h })

  it('sin contenido deja el lienzo tal cual, al 100%', () => {
    expect(fitToContent([], { width: 1000, height: 800 })).toEqual(inicio)
  })

  it('no amplía por encima del 100%: un dibujo pequeño no se pone gigante', () => {
    const viewport = fitToContent([caja(0, 0)], { width: 2000, height: 1600 })

    expect(viewport.zoom).toBe(1)
  })

  it('reduce hasta que el contenido cabe, con margen', () => {
    const viewport = fitToContent([caja(0, 0), caja(1600, 1000)], { width: 1000, height: 800 })

    expect(viewport.zoom).toBeLessThan(1)
    const esquina = worldToScreen({ x: 0, y: 0 }, viewport)
    const opuesta = worldToScreen({ x: 1840, y: 1120 }, viewport)
    expect(esquina.x).toBeGreaterThanOrEqual(0)
    expect(esquina.y).toBeGreaterThanOrEqual(0)
    expect(opuesta.x).toBeLessThanOrEqual(1000)
    expect(opuesta.y).toBeLessThanOrEqual(800)
  })

  it('un dibujo enorme no rompe el tope de zoom: baja al mínimo y lo centra', () => {
    const viewport = fitToContent([caja(0, 0), caja(9000, 7000)], { width: 1000, height: 800 })

    // no cabe ni al 25%, así que se queda en el mínimo permitido y centrado
    expect(viewport.zoom).toBe(ZOOM_LIMITS.min)
    const centro = worldToScreen({ x: 4620, y: 3560 }, viewport)
    expect(centro.x).toBeCloseTo(500, 6)
    expect(centro.y).toBeCloseTo(400, 6)
  })

  it('centra el contenido en el viewport', () => {
    const cajas = [caja(1000, 500)]
    const viewport = fitToContent(cajas, { width: 1000, height: 800 })

    const centro = worldToScreen({ x: 1120, y: 560 }, viewport)
    expect(centro.x).toBeCloseTo(500, 6)
    expect(centro.y).toBeCloseTo(400, 6)
  })

  it('encaja también contenido en coordenadas negativas: el mundo no empieza en cero', () => {
    const viewport = fitToContent([caja(-800, -600)], { width: 1000, height: 800 })

    const centro = worldToScreen({ x: -680, y: -540 }, viewport)
    expect(centro.x).toBeCloseTo(500, 6)
    expect(centro.y).toBeCloseTo(400, 6)
  })
})
