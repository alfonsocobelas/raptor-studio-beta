import type { NodeBox, NodePosition } from './model-diagram'

/**
 * Cámara del lienzo: un desplazamiento y una escala. Las cajas viven en
 * coordenadas de MUNDO —negativas incluidas, el mundo no empieza en cero— y el
 * viewport decide qué trozo se ve. Es estado cosmético, como el layout arrastrado:
 * memoria de la sesión, nunca el schema.
 */
export interface Viewport {
  pan: NodePosition
  zoom: number
}

export const ZOOM_LIMITS = { min: 0.25, max: 2 } as const

/** Margen que fitToContent deja alrededor del dibujo. */
export const FIT_MARGIN = 48

export const INITIAL_VIEWPORT: Viewport = { pan: { x: 0, y: 0 }, zoom: 1 }

export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_LIMITS.max, Math.max(ZOOM_LIMITS.min, zoom))
}

export function screenToWorld(point: NodePosition, viewport: Viewport): NodePosition {
  return { x: (point.x - viewport.pan.x) / viewport.zoom, y: (point.y - viewport.pan.y) / viewport.zoom }
}

export function worldToScreen(point: NodePosition, viewport: Viewport): NodePosition {
  return { x: point.x * viewport.zoom + viewport.pan.x, y: point.y * viewport.zoom + viewport.pan.y }
}

/**
 * Zoom ANCLADO al puntero: lo que hay bajo el cursor no se mueve, que es la única
 * forma de que ampliar no te haga perder de vista lo que estabas mirando.
 */
export function zoomAt(viewport: Viewport, factor: number, point: NodePosition): Viewport {
  const zoom = clampZoom(viewport.zoom * factor)
  const escala = zoom / viewport.zoom
  return {
    zoom,
    pan: {
      x: point.x - (point.x - viewport.pan.x) * escala,
      y: point.y - (point.y - viewport.pan.y) * escala
    }
  }
}

/**
 * Encaja el dibujo en el viewport y lo centra. No amplía por encima del 100%: un
 * diagrama de dos cajas no debe salir gigante por tener sitio.
 */
export function fitToContent(boxes: NodeBox[], viewport: { width: number; height: number }): Viewport {
  if (!boxes.length) return INITIAL_VIEWPORT

  const izquierda = Math.min(...boxes.map(box => box.x))
  const arriba = Math.min(...boxes.map(box => box.y))
  const derecha = Math.max(...boxes.map(box => box.x + box.width))
  const abajo = Math.max(...boxes.map(box => box.y + box.height))
  const ancho = derecha - izquierda
  const alto = abajo - arriba

  const disponibleX = Math.max(1, viewport.width - FIT_MARGIN * 2)
  const disponibleY = Math.max(1, viewport.height - FIT_MARGIN * 2)
  const zoom = clampZoom(Math.min(1, disponibleX / Math.max(1, ancho), disponibleY / Math.max(1, alto)))

  // centrar: el centro del dibujo cae en el centro del viewport
  const centro = { x: izquierda + ancho / 2, y: arriba + alto / 2 }
  return {
    zoom,
    pan: { x: viewport.width / 2 - centro.x * zoom, y: viewport.height / 2 - centro.y * zoom }
  }
}
