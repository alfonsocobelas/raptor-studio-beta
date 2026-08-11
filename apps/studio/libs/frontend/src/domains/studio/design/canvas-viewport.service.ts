import { Injectable, computed, signal, type Signal } from '@angular/core'
import { INITIAL_VIEWPORT, fitToContent, zoomAt, type NodeBox, type NodePosition, type Viewport } from '@app/shared/domain'

/** Lienzos con cámara propia: el modelo y los flujos se miran por separado. */
export type CanvasId = 'model' | 'flows'

/**
 * La cámara de cada lienzo (desplazamiento y escala). Vive aquí, en memoria de la
 * sesión, por el mismo motivo que el layout arrastrado: es cosmético y jamás entra
 * en el diseño ni en el schema.
 */
@Injectable({ providedIn: 'root' })
export class CanvasViewportService {
  private readonly viewports = signal<Record<CanvasId, Viewport>>({
    model: INITIAL_VIEWPORT,
    flows: INITIAL_VIEWPORT
  })

  of(id: CanvasId): Signal<Viewport> {
    return computed(() => this.viewports()[id])
  }

  panBy(id: CanvasId, delta: NodePosition): void {
    this.update(id, current => ({
      ...current,
      pan: { x: current.pan.x + delta.x, y: current.pan.y + delta.y }
    }))
  }

  /** `point` va en coordenadas de pantalla relativas al lienzo. */
  zoomBy(id: CanvasId, factor: number, point: NodePosition): void {
    this.update(id, current => zoomAt(current, factor, point))
  }

  resetZoom(id: CanvasId): void {
    this.update(id, current => ({ ...current, zoom: 1 }))
  }

  fit(id: CanvasId, boxes: NodeBox[], size: { width: number; height: number }): void {
    this.update(id, () => fitToContent(boxes, size))
  }

  private update(id: CanvasId, patch: (current: Viewport) => Viewport): void {
    this.viewports.update(all => ({ ...all, [id]: patch(all[id]) }))
  }
}
