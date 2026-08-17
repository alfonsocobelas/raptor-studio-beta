import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild, type ElementRef } from '@angular/core'
import { ACCESS_LAYOUT, accessGraph } from '@app/shared/domain'
import { AccessUiService } from './access-ui.service'
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
  selector: 'studio-access-diagram-view',
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
            [attr.width]="graph().width + 80"
            [attr.height]="graph().height + 80"
            data-testid="access-diagram"
          >
            <g transform="translate(40, 40)">
              <!-- Las curvas van DEBAJO de las tarjetas, como en Flujos, y toman el color del
                   rol activo: al cambiar de rol el grafo entero cambia de acento. -->
              @for (edge of graph().edges; track edge.entity) {
                <path
                  [attr.d]="edge.d"
                  class="access-edge"
                  [attr.data-accent]="edge.accent"
                  [attr.data-tone]="edge.tone"
                  fill="none"
                  stroke-width="2"
                  [attr.data-testid]="'access-edge-' + edge.entity"
                />
                <circle
                  [attr.cx]="edge.x2"
                  [attr.cy]="edge.y2"
                  r="5"
                  class="access-port"
                  [attr.data-accent]="edge.accent"
                  [attr.data-tone]="edge.tone"
                />
              }

              <!-- nodo del ROL: la misma tarjeta que un nodo de flujo, con su puerto de salida -->
              <g data-testid="access-role-node">
                <rect
                  [attr.x]="graph().role.x"
                  [attr.y]="graph().role.y"
                  [attr.width]="graph().role.width"
                  [attr.height]="graph().role.height"
                  rx="12"
                  class="access-role-plate"
                  [attr.data-accent]="graph().role.accent"
                  stroke-width="1.5"
                />
                <text
                  [attr.x]="graph().role.x + 24"
                  [attr.y]="graph().role.y + 28"
                  class="fill-muted-foreground text-[10px] uppercase tracking-[0.14em]"
                >
                  Rol
                </text>
                <text
                  [attr.x]="graph().role.x + 24"
                  [attr.y]="graph().role.y + 54"
                  class="fill-foreground text-[17px] font-semibold"
                >
                  {{ graph().role.label }}
                </text>
                <text
                  [attr.x]="graph().role.x + 24"
                  [attr.y]="graph().role.y + 76"
                  class="fill-muted-foreground text-xs"
                >
                  {{ graph().role.subtitle }}
                </text>
                <circle
                  [attr.cx]="graph().role.x + graph().role.width"
                  [attr.cy]="graph().role.y + graph().role.height / 2"
                  r="5"
                  class="access-port"
                  [attr.data-accent]="graph().role.accent"
                  [attr.data-tone]="graph().role.tone"
                />
              </g>

              @for (card of graph().cards; track card.entity) {
                <g [attr.data-testid]="'access-card-' + card.entity" [attr.data-badge]="card.badge">
                  <rect
                    [attr.x]="card.x"
                    [attr.y]="card.y"
                    [attr.width]="card.width"
                    [attr.height]="card.height"
                    rx="12"
                    class="access-card-plate"
                    stroke-width="1"
                  />
                  <text
                    [attr.x]="card.x + 18"
                    [attr.y]="card.y + 28"
                    class="fill-muted-foreground text-[10px] uppercase tracking-[0.14em]"
                  >
                    {{ card.label }}
                  </text>
                  <text
                    [attr.x]="card.x + card.width - 18"
                    [attr.y]="card.y + 28"
                    text-anchor="end"
                    class="access-badge text-[10px] uppercase tracking-[0.14em]"
                    [attr.data-badge]="card.badge"
                  >
                    {{ card.badge }}
                  </text>
                  <line
                    [attr.x1]="card.x"
                    [attr.y1]="card.y + layout.card.headerHeight"
                    [attr.x2]="card.x + card.width"
                    [attr.y2]="card.y + layout.card.headerHeight"
                    class="stroke-border"
                  />
                  @for (chip of card.chips; track chip.capability; let i = $index) {
                    <g>
                      <rect
                        [attr.x]="chipX(card, i)"
                        [attr.y]="card.y + layout.card.headerHeight + layout.card.padding"
                        [attr.width]="chipWidth(chip.label)"
                        [attr.height]="layout.card.chipHeight"
                        rx="7"
                        class="access-chip"
                        [attr.data-granted]="chip.granted"
                        [attr.data-tone]="chip.tone"
                        stroke-width="1"
                      />
                      <text
                        [attr.x]="chipX(card, i) + chipWidth(chip.label) / 2"
                        [attr.y]="card.y + layout.card.headerHeight + layout.card.padding + 20"
                        text-anchor="middle"
                        class="access-chip-text text-xs"
                        [attr.data-granted]="chip.granted"
                        [attr.data-tone]="chip.tone"
                      >
                        {{ chip.label }}
                      </text>
                    </g>
                  }
                </g>
              }
            </g>
          </svg>
        </div>
      </div>
    }
  `,
  styles: `
    /* Paleta del grafo. En CSS y no con utilidades porque el color depende de DOS ejes (rol
       activo × capacidad) y Tailwind v4 resuelve 'dark:' por preferencia del sistema, mientras
       el estudio conmuta el tema con la clase .dark en :root.
       Acento por ROL: Usuario naranja de la casa, Consulta verde, Admin tinta. Dentro de cada
       rol, la lectura va más suave que la escritura. */
    /* El TONO manda en la arista, como en la maqueta: naranja si el rol toca la entidad,
       verde si solo la mira. Al cambiar de rol cambian los tonos —Consulta pone el grafo
       en verde y Usuario en naranja—, que es justo la señal que se busca. */
    .access-edge[data-tone='write'] {
      stroke: var(--flow-accent);
    }
    .access-edge[data-tone='read'] {
      stroke: #2f9e6d;
    }
    /* Admin no se reparte nada: su grafo va en tinta para no competir con los otros dos. */
    .access-edge[data-accent='admin'] {
      stroke: color-mix(in oklab, var(--foreground) 50%, transparent);
    }

    .access-port {
      fill: var(--background);
      stroke-width: 2;
    }
    .access-port[data-tone='write'] {
      stroke: var(--flow-accent);
    }
    .access-port[data-tone='read'] {
      stroke: #2f9e6d;
    }
    .access-port[data-accent='admin'] {
      stroke: color-mix(in oklab, var(--foreground) 50%, transparent);
    }

    .access-role-plate {
      fill: var(--card);
    }
    .access-role-plate[data-accent='user'] {
      stroke: var(--flow-accent);
    }
    .access-role-plate[data-accent='viewer'] {
      stroke: #2f9e6d;
    }
    .access-role-plate[data-accent='admin'] {
      stroke: color-mix(in oklab, var(--foreground) 45%, transparent);
    }

    .access-card-plate {
      fill: var(--card);
      stroke: var(--border);
    }

    /* El badge de la cabecera y los chips comparten semáforo: concedido con color, denegado
       apagado — el mismo criterio que la tabla, para que las dos vistas cuenten lo mismo. */
    .access-badge[data-badge='editar'] {
      fill: var(--flow-accent);
    }
    .access-badge[data-badge='solo ver'] {
      fill: #2f9e6d;
    }
    .access-badge[data-badge='sin acceso'] {
      fill: var(--muted-foreground);
    }

    .access-chip {
      fill: transparent;
      stroke: var(--border);
    }
    .access-chip[data-granted='true'][data-tone='read'] {
      fill: color-mix(in oklab, #2f9e6d 12%, transparent);
      stroke: color-mix(in oklab, #2f9e6d 45%, transparent);
    }
    .access-chip[data-granted='true'][data-tone='write'] {
      fill: color-mix(in oklab, var(--flow-accent) 14%, transparent);
      stroke: color-mix(in oklab, var(--flow-accent) 50%, transparent);
    }
    .access-chip-text {
      fill: var(--muted-foreground);
    }
    .access-chip-text[data-granted='true'][data-tone='read'] {
      fill: #2f9e6d;
    }
    .access-chip-text[data-granted='true'][data-tone='write'] {
      fill: var(--flow-accent);
    }
  `
})
export class AccessDiagramViewComponent {
  protected readonly store = inject(DesignStore)
  private readonly ui = inject(AccessUiService)
  private readonly viewport = inject(CanvasViewportService)

  protected readonly layout = ACCESS_LAYOUT

  protected readonly graph = computed(() => accessGraph(this.store.resources(), this.ui.role()))

  /** Ancho del chip estimado del texto: el SVG no mide, y medir obligaría a un reflow por chip. */
  protected chipWidth(label: string): number {
    return Math.round(label.length * 6.6) + 22
  }

  protected chipX(card: { x: number; chips: { label: string }[] }, index: number): number {
    const previos = card.chips
      .slice(0, index)
      .reduce((suma, chip) => suma + this.chipWidth(chip.label) + ACCESS_LAYOUT.card.chipGap, 0)
    return card.x + ACCESS_LAYOUT.card.padding + previos
  }

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
    const { width, height } = this.graph()
    this.viewport.fit('access', [{ x: 0, y: 0, width: width + 80, height: height + 80 }], {
      width: caja.width,
      height: caja.height
    })
  }
}
