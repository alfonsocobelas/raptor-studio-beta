import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core'
import { STATE_NODE, stateDiagram } from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { CanvasControlsComponent } from './canvas-controls.component'
import { CanvasViewportService } from './canvas-viewport.service'
import { DesignStore } from './design-store'
import { StateDiagramComponent } from './state-diagram.component'

/**
 * Sub-vista del ciclo de vida: el diagrama de estados de la entidad elegida a lienzo
 * completo, con su cámara propia (pan/zoom + encajar), como Flujos. Sustituye a la capa
 * fija que desbordaba el lienzo del modelo con máquinas grandes. El diagrama sigue siendo
 * el MISMO componente editable; aquí solo se le da sitio.
 */
@Component({
  selector: 'studio-lifecycle-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CanvasControlsComponent, StateDiagramComponent],
  template: `
    <div
      #viewportEl
      class="model-grid absolute inset-0 overflow-hidden"
      [style.background-position]="gridOffset()"
      [style.background-size]="gridSize()"
      [class.cursor-grabbing]="panning()"
      data-testid="lifecycle-view"
      (pointerdown)="startPan($event)"
      (wheel)="onWheel($event)"
    >
      <div class="absolute left-4 top-4 z-30">
        <button
          type="button"
          class="bg-card hover:border-foreground/40 rounded-md border px-2.5 py-1.5 text-xs shadow-sm transition-colors"
          data-testid="lifecycle-back"
          (click)="back.emit()"
        >
          ← Volver al modelo
        </button>
      </div>
      <div class="absolute right-4 top-4 z-30">
        <studio-canvas-controls (fit)="fitToView()" />
      </div>
      <div class="absolute left-0 top-0 origin-top-left" [style.transform]="worldTransform()">
        <studio-state-diagram />
      </div>
    </div>
  `,
  styles: `
    /* El mismo papel de puntos que el lienzo del modelo: es la misma pantalla, otra capa. */
    .model-grid {
      background-image: radial-gradient(
        circle,
        color-mix(in oklab, #d75f3d 35%, transparent) 1.4px,
        transparent 1.4px
      );
      background-size: 24px 24px;
      background-position: -12px -12px;
    }
  `
})
export class LifecycleViewComponent {
  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)
  private readonly viewport = inject(CanvasViewportService)

  readonly back = output<void>()

  private readonly viewportRef = viewChild<ElementRef<HTMLElement>>('viewportEl')
  protected readonly camera = this.viewport.of('lifecycle')
  protected readonly panning = signal(false)

  protected readonly worldTransform = computed(() => {
    const { pan, zoom } = this.camera()
    return `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
  })

  protected readonly gridOffset = computed(() => {
    const { pan } = this.camera()
    return `${pan.x}px ${pan.y}px`
  })
  protected readonly gridSize = computed(() => {
    const celda = 24 * this.camera().zoom
    return `${celda}px ${celda}px`
  })

  /** El hueco que ocupa la tarjeta del diagrama, para el botón de encajar. */
  private readonly extent = computed(() => {
    const resource = this.store.resources().find(r => r.name === this.active.resource())
    const machine = resource?.state
    const values = resource?.fields.find(f => f.name === machine?.field)?.values
    if (!machine || !values?.length) return null
    const layout = stateDiagram(machine, values)
    // la tarjeta añade padding, cabecera y la fila del editor alrededor del SVG
    return { x: 0, y: 0, width: layout.width + 48, height: layout.height + STATE_NODE.height + 120 }
  })

  /** Arrastrar el PAPEL mueve la cámara; sobre el diagrama mandan sus propios gestos. */
  protected startPan(down: PointerEvent): void {
    if (down.button !== 0) return
    const target = down.target as HTMLElement
    if (target.closest('[data-testid="state-diagram"], button, input, [data-testid="canvas-controls"]')) return

    const element = down.currentTarget as HTMLElement
    element.setPointerCapture(down.pointerId)
    this.panning.set(true)
    let last = { x: down.clientX, y: down.clientY }

    const onMove = (move: PointerEvent) => {
      this.viewport.panBy('lifecycle', { x: move.clientX - last.x, y: move.clientY - last.y })
      last = { x: move.clientX, y: move.clientY }
    }
    const onUp = () => {
      this.panning.set(false)
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onUp)
    }
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onUp)
  }

  /** Rueda: con ⌘/ctrl hace zoom en el cursor; sin él, desplaza (canon model-view). */
  protected onWheel(event: WheelEvent): void {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) {
      const caja = this.viewportRef()?.nativeElement.getBoundingClientRect()
      const punto = { x: event.clientX - (caja?.left ?? 0), y: event.clientY - (caja?.top ?? 0) }
      this.viewport.zoomBy('lifecycle', event.deltaY < 0 ? 1.08 : 1 / 1.08, punto)
      return
    }
    this.viewport.panBy('lifecycle', { x: -event.deltaX, y: -event.deltaY })
  }

  protected fitToView(): void {
    const caja = this.viewportRef()?.nativeElement.getBoundingClientRect()
    const box = this.extent()
    if (!caja || !caja.width || !box) return
    this.viewport.fit('lifecycle', [box], { width: caja.width, height: caja.height })
  }
}
