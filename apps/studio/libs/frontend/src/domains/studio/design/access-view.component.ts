import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, type ElementRef } from '@angular/core'
import { ACCESS_LAYOUT, accessDiagram } from '@app/shared/domain'
import { CanvasControlsComponent } from './canvas-controls.component'
import { CanvasViewportService } from './canvas-viewport.service'
import { DesignStore } from './design-store'

/**
 * El lienzo del modo Accesos (spec 46): el diagrama de casos de uso DERIVADO del diseño.
 * Solo lectura — el raíl edita, esto pinta — con la misma cámara (pan/zoom/encajar) que
 * los demás diagramas. Las aristas de admin van atenuadas: siempre están todas y lo
 * interesante es lo que la matriz reparte entre Usuario y Consulta.
 */
@Component({
  selector: 'studio-access-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CanvasControlsComponent],
  template: `
    @if (!store.resources().length) {
      <div class="flex h-full flex-col items-center justify-center text-center" data-testid="access-view-empty">
        <p class="text-muted-foreground mb-2 text-lg">Sin entidades todavía</p>
        <p class="text-muted-foreground max-w-md text-sm">
          El diagrama de casos de uso se deriva del diseño: crea entidades en la pestaña
          <strong>Modelo</strong> y aquí verás quién puede ver, gestionar y transicionar cada una.
        </p>
      </div>
    } @else {
      <div
        #viewportEl
        class="absolute inset-0 overflow-hidden"
        [class.cursor-grabbing]="panning()"
        data-testid="access-viewport"
        (pointerdown)="startPan($event)"
        (wheel)="onWheel($event)"
      >
        <div class="absolute right-4 top-4 z-30">
          <studio-canvas-controls (fit)="fitToView()" />
        </div>

        <div class="absolute left-0 top-0 origin-top-left" [style.transform]="worldTransform()">
          <svg
            class="overflow-visible"
            [attr.width]="diagram().width + 80"
            [attr.height]="diagram().height + 80"
            data-testid="access-diagram"
          >
            <g transform="translate(40, 40)">
              @for (edge of diagram().edges; track edge.role + edge.capability) {
                <line
                  [attr.x1]="edge.x1"
                  [attr.y1]="edge.y1"
                  [attr.x2]="edge.x2"
                  [attr.y2]="edge.y2"
                  class="stroke-foreground"
                  [attr.stroke-opacity]="edge.role === 'admin' ? 0.18 : 0.55"
                  stroke-width="1.2"
                  [attr.data-testid]="'access-edge-' + edge.role + '-' + edge.capability"
                />
              }

              @for (actor of diagram().actors; track actor.role) {
                <g [attr.data-testid]="'access-actor-' + actor.role">
                  <rect
                    [attr.x]="actor.x"
                    [attr.y]="actor.y"
                    [attr.width]="layout.actor.width"
                    [attr.height]="layout.actor.height"
                    rx="9"
                    class="fill-card stroke-foreground/60"
                    stroke-width="1.2"
                  />
                  <text
                    [attr.x]="actor.x + layout.actor.width / 2"
                    [attr.y]="actor.y + layout.actor.height / 2 + 4"
                    text-anchor="middle"
                    class="fill-foreground text-xs font-medium"
                  >
                    {{ actor.label }}
                  </text>
                </g>
              }

              @for (box of diagram().boxes; track box.entity) {
                <g [attr.data-testid]="'access-system-' + box.entity">
                  <rect
                    [attr.x]="box.x"
                    [attr.y]="box.y"
                    [attr.width]="box.width"
                    [attr.height]="box.height"
                    rx="12"
                    class="fill-card/60 stroke-foreground/40"
                    stroke-width="1"
                  />
                  <text [attr.x]="box.x + 16" [attr.y]="box.y + 24" class="fill-muted-foreground text-xs uppercase">
                    {{ box.label }}
                  </text>
                </g>
              }

              @for (capability of diagram().capabilities; track capability.key) {
                <g [attr.data-testid]="'access-capability-' + capability.key">
                  <ellipse
                    [attr.cx]="capability.cx"
                    [attr.cy]="capability.cy"
                    [attr.rx]="capability.rx"
                    [attr.ry]="capability.ry"
                    class="fill-background stroke-foreground/70"
                    stroke-width="1.2"
                  />
                  <text
                    [attr.x]="capability.cx"
                    [attr.y]="capability.cy + 4"
                    text-anchor="middle"
                    class="fill-foreground text-xs"
                  >
                    {{ capability.label }}
                  </text>
                </g>
              }
            </g>
          </svg>
        </div>
      </div>
    }
  `
})
export class AccessViewComponent {
  protected readonly store = inject(DesignStore)
  private readonly viewport = inject(CanvasViewportService)

  protected readonly layout = ACCESS_LAYOUT

  protected readonly diagram = computed(() => accessDiagram(this.store.resources()))

  private readonly viewportRef = viewChild<ElementRef<HTMLElement>>('viewportEl')
  protected readonly camera = this.viewport.of('access')
  protected readonly panning = signal(false)

  protected readonly worldTransform = computed(() => {
    const { pan, zoom } = this.camera()
    return `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
  })

  /** Arrastrar el papel mueve la cámara; sobre los controles, no. */
  protected startPan(down: PointerEvent): void {
    if (down.button !== 0) return
    if ((down.target as HTMLElement).closest('button, [data-testid="canvas-controls"]')) return

    const element = down.currentTarget as HTMLElement
    element.setPointerCapture(down.pointerId)
    this.panning.set(true)
    let last = { x: down.clientX, y: down.clientY }

    const onMove = (move: PointerEvent) => {
      this.viewport.panBy('access', { x: move.clientX - last.x, y: move.clientY - last.y })
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

  protected onWheel(event: WheelEvent): void {
    event.preventDefault()
    if (event.ctrlKey || event.metaKey) {
      const caja = this.viewportRef()?.nativeElement.getBoundingClientRect()
      const punto = { x: event.clientX - (caja?.left ?? 0), y: event.clientY - (caja?.top ?? 0) }
      this.viewport.zoomBy('access', event.deltaY < 0 ? 1.08 : 1 / 1.08, punto)
      return
    }
    this.viewport.panBy('access', { x: -event.deltaX, y: -event.deltaY })
  }

  protected fitToView(): void {
    const caja = this.viewportRef()?.nativeElement.getBoundingClientRect()
    if (!caja) return
    const { width, height } = this.diagram()
    this.viewport.fit('access', [{ x: 0, y: 0, width: width + 80, height: height + 80 }], {
      width: caja.width,
      height: caja.height
    })
  }
}
