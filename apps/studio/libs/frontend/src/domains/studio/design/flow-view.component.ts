import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { BusinessFlow, FlowNode, FlowNodeKind } from '@acc/schema'
import {
  FLOW_GRID,
  FLOW_GROUP,
  canvasExtent,
  flowAlternateEdges,
  flowCondensed,
  flowEdgeCurve,
  flowGroupBox,
  flowGroups,
  flowLayout,
  flowNodeBox,
  nodeAt,
  type FlowEdgeCurve,
  type FlowGroup,
  type NodeBox,
  type NodePosition
} from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { CanvasControlsComponent } from './canvas-controls.component'
import { CanvasViewportService } from './canvas-viewport.service'
import { FlowOrientationService } from './flow-orientation.service'
import { DesignStore } from './design-store'

interface FlowDiagramNode {
  node: FlowNode
  box: NodeBox
}

interface FlowDiagramEdge {
  from: string
  to: string
  label?: string
  /** Salida secundaria de una decisión: se dibuja discontinua */
  alternate: boolean
  line: FlowEdgeCurve
}

const KIND_LABELS: Record<FlowNodeKind, string> = {
  start: 'inicio',
  step: 'paso',
  decision: 'decisión',
  end: 'fin'
}

/** Lo elegible en el lienzo: un nodo o una arista (identidad completa). */
type FlowSelection = { kind: 'node'; id: string } | { kind: 'edge'; from: string; to: string; label?: string }

/**
 * La vista de FLUJOS (spec 28): los procesos de negocio del diseño, dibujados
 * y EDITABLES (TASK-05). Otra proyección del DesignStore — cada gesto llama a
 * una mutación del store; el dibujo nunca guarda nada propio salvo el layout,
 * que es cosmético y vive en memoria de la sesión.
 */
@Component({
  selector: 'studio-flow-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CanvasControlsComponent],
  host: { '(document:keydown.delete)': 'onDeleteKey($event)' },
  template: `
    @if (!store.flows().length) {
      <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-flows">
        <p class="text-muted-foreground mb-2 text-lg">Sin procesos todavía</p>
        <p class="text-muted-foreground max-w-md text-sm">
          Cuéntale al chat cómo trabaja el negocio («cuando llega un pedido…») o crea uno con
          <strong>Nuevo flujo</strong> en el panel de la izquierda: los pasos se conectan arrastrando desde su asa.
        </p>
      </div>
    }

    @if (activeFlow(); as flow) {
      @if (flow.description) {
        <p class="text-muted-foreground mb-3 max-w-2xl text-sm">{{ flow.description }}</p>
      }
      <!-- Lienzo infinito: el viewport recorta y el MUNDO se mueve con la cámara. -->
      <div
        #viewportEl
        class="flow-grid absolute inset-0 overflow-hidden"
        [style.background-position]="gridOffset()"
        [style.background-size]="gridSize()"
        [class.cursor-grabbing]="panning()"
        data-testid="flow-viewport"
        (pointerdown)="startPan($event)"
        (wheel)="onWheel($event)"
      >
        <div class="absolute right-4 top-4 z-30 flex items-center gap-2">
          <button
            type="button"
            class="bg-card canvas-card studio-ui hover:bg-accent/60 rounded-[9px] border px-2.5 py-1.5 transition-colors"
            [attr.title]="
              orientation.value() === 'horizontal' ? 'Leer el proceso en columna' : 'Leer el proceso en fila'
            "
            data-testid="flow-orientation"
            (click)="orientation.toggle()"
          >
            {{ orientation.value() === 'horizontal' ? '→' : '↓' }}
          </button>
          <studio-canvas-controls (fit)="fitToView()" />
        </div>
        <div
          class="absolute left-0 top-0 origin-top-left"
          [style.transform]="worldTransform()"
          data-testid="flow-surface"
          (click)="selected.set(null)"
        >
          <svg
            class="pointer-events-none absolute left-0 top-0 overflow-visible"
            [attr.width]="surface().width"
            [attr.height]="surface().height"
            data-testid="flow-edges"
          >
            <defs>
              <marker
                id="flow-arrow"
                markerWidth="13"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 2 1.5 L 9.5 6 L 2 10.5" fill="none" class="stroke-foreground" stroke-width="1.8" />
              </marker>
              <!-- la salida alternativa de una decisión va apagada, como la RAMA NO de 12A -->
              <marker
                id="flow-arrow-alt"
                markerWidth="13"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M 2 1.5 L 9.5 6 L 2 10.5" fill="none" class="stroke-muted-foreground" stroke-width="1.8" />
              </marker>
            </defs>
            @for (item of edges(); track item.from + '→' + item.to + (item.label ?? '')) {
              <g
                class="group/edge pointer-events-auto cursor-pointer"
                [attr.data-testid]="'flow-edge-' + item.from + '-' + item.to"
                (click)="selectEdge($event, item)"
              >
                <!-- zona de clic ancha e invisible: el trazo fino es imposible de acertar -->
                <path [attr.d]="item.line.d" fill="none" stroke="transparent" stroke-width="14" />
                <path
                  [attr.d]="item.line.d"
                  fill="none"
                  [class]="
                    isEdgeSelected(item)
                      ? 'stroke-primary'
                      : item.alternate
                        ? 'stroke-muted-foreground'
                        : 'stroke-foreground'
                  "
                  [attr.stroke-width]="isEdgeSelected(item) ? 2.5 : 1.5"
                  [attr.stroke-dasharray]="item.alternate ? '5 4' : null"
                  [attr.marker-end]="item.alternate ? 'url(#flow-arrow-alt)' : 'url(#flow-arrow)'"
                />
                @if (item.label) {
                  <!-- la etiqueta de una salida de decisión va en pastilla: se lee sobre la rejilla -->
                  <rect
                    [attr.x]="item.line.labelX - 22"
                    [attr.y]="item.line.labelY - 10"
                    width="44"
                    height="20"
                    rx="6"
                    class="fill-card stroke-border"
                    stroke-width="1"
                  />
                  <text
                    [attr.x]="item.line.labelX"
                    [attr.y]="item.line.labelY + 4"
                    text-anchor="middle"
                    [class]="
                      'text-[10px] font-medium ' + (isEdgeSelected(item) ? 'fill-primary' : 'fill-muted-foreground')
                    "
                  >
                    {{ item.label }}
                  </text>
                }
              </g>
            }
            @if (linking(); as ghost) {
              <line
                [attr.x1]="ghost.x1"
                [attr.y1]="ghost.y1"
                [attr.x2]="ghost.x2"
                [attr.y2]="ghost.y2"
                class="stroke-primary"
                stroke-width="1.5"
                stroke-dasharray="5 4"
                marker-end="url(#flow-arrow)"
                data-testid="flow-ghost-edge"
              />
            }
          </svg>

          <!-- borrar lo seleccionado (también tecla Supr) -->
          @if (deleteButtonAt(); as at) {
            <button
              type="button"
              class="bg-destructive text-destructive-foreground absolute z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs leading-none shadow"
              [style.left.px]="at.x"
              [style.top.px]="at.y"
              data-testid="flow-delete-selected"
              title="Eliminar (Supr)"
              (click)="$event.stopPropagation(); deleteSelected()"
            >
              ×
            </button>
          }

          <!-- TARJETAS DE ACCIONES: las acciones seguidas de una rama se leen juntas,
             con sus filas numeradas y su «+ Acción», como la RAMA SÍ de la referencia -->
          @for (card of cards(); track card.group.id) {
            <div
              class="group/card studio-ui absolute"
              [style.left.px]="card.box.x"
              [style.top.px]="card.box.y"
              [style.width.px]="card.box.width"
              [attr.data-testid]="'flow-card-' + card.group.id"
            >
              <div
                class="bg-card flow-card overflow-hidden rounded-[12px] border"
                [class.ring-2]="isNodeSelected(card.group.id)"
              >
                <!-- cabecera: de qué rama cuelga y cuántas acciones lleva; y es el asa de arrastre -->
                <div
                  class="flex cursor-move items-center gap-2 px-2.5"
                  [style.height.px]="groupMetrics.headerHeight"
                  (pointerdown)="startDrag($event, card.group.id, card.box)"
                  (click)="selectNode($event, card.group.id)"
                >
                  <span
                    class="text-muted-foreground rounded-[5px] border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em]"
                    [attr.data-testid]="'flow-card-branch-' + card.group.id"
                  >
                    {{ card.group.branch ? 'rama ' + card.group.branch : 'acciones' }}
                  </span>
                  <span class="text-muted-foreground text-[10px]">{{ card.group.steps.length }}</span>
                </div>

                @for (step of card.group.steps; track step.id; let i = $index) {
                  <div
                    class="group/row hover:bg-accent/40 relative flex items-center gap-2 border-t px-2.5 transition-colors"
                    [class.bg-accent]="isNodeSelected(step.id)"
                    [style.height.px]="groupMetrics.rowHeight"
                    [attr.data-testid]="'flow-step-' + step.id"
                    (click)="selectNode($event, step.id)"
                    (dblclick)="startEdit(step)"
                  >
                    <span
                      class="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] font-semibold"
                      [attr.data-testid]="'flow-step-number-' + step.id"
                    >
                      {{ i + 1 }}
                    </span>
                    @if (editing() === step.id) {
                      <div class="flex min-w-0 flex-1 flex-col gap-1" (click)="$event.stopPropagation()">
                        <input
                          class="border-input rounded border px-1.5 py-0.5 text-xs"
                          name="stepText"
                          [ngModel]="step.text"
                          (ngModelChange)="store.updateFlowNode(activeName()!, step.id, { text: $event })"
                          (keydown.enter)="editing.set(null)"
                          data-testid="flow-node-text-input"
                        />
                        <select
                          class="border-input rounded border px-1 py-0.5 text-[10px]"
                          name="stepEntity"
                          [ngModel]="step.entity ?? ''"
                          (ngModelChange)="setEntity(step.id, $event)"
                          data-testid="flow-node-entity-select"
                        >
                          <option value="">— sin entidad —</option>
                          @for (resource of store.resources(); track resource.name) {
                            <option [value]="resource.name">{{ resource.labelSingular }}</option>
                          }
                        </select>
                      </div>
                    } @else {
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-[13px] font-semibold leading-tight">{{ step.text }}</span>
                        @if (step.entity) {
                          <span class="text-muted-foreground block truncate text-[11px]">{{ step.entity }}</span>
                        }
                      </span>
                      <button
                        type="button"
                        class="text-muted-foreground hover:text-destructive shrink-0 text-xs opacity-0 transition-opacity group-hover/row:opacity-100"
                        [attr.data-testid]="'flow-step-remove-' + step.id"
                        title="Quitar la acción"
                        (click)="$event.stopPropagation(); removeStep(step.id)"
                      >
                        ×
                      </button>
                    }
                  </div>
                }

                <!-- el «+ Acción» de la referencia: aquí se mete un paso, no en la flecha -->
                <button
                  type="button"
                  class="text-muted-foreground hover:bg-accent/40 hover:text-foreground flex w-full items-center gap-1.5 border-t px-2.5 text-left text-[11px] transition-colors"
                  [style.height.px]="groupMetrics.footerHeight"
                  [attr.data-testid]="'flow-card-add-' + card.group.id"
                  (click)="$event.stopPropagation(); addAction(card.group)"
                >
                  <span class="text-[13px] leading-none">+</span> Acción
                </button>
              </div>

              <!-- asa de conexión: se ve al pasar por encima y se arrastra hasta otro bloque -->
              <button
                type="button"
                class="bg-primary ring-background absolute -right-2 top-1/2 z-20 size-3.5 -translate-y-1/2 cursor-crosshair rounded-full opacity-0 ring-2 transition-opacity group-hover/card:opacity-100"
                [attr.data-testid]="'flow-link-handle-' + card.group.id"
                title="Arrastra hasta otro bloque para conectarlos"
                (pointerdown)="startLink($event, card.group.id, card.box)"
              ></button>
            </div>
          }

          @for (item of pills(); track item.node.id) {
            <div
              class="group studio-ui absolute flex cursor-move items-center px-2"
              [class.text-background]="item.node.kind === 'start'"
              [style.left.px]="item.box.x"
              [style.top.px]="item.box.y"
              [style.width.px]="item.box.width"
              [style.height.px]="item.box.height"
              [attr.data-testid]="'flow-node-' + item.node.id"
              [attr.data-kind]="item.node.kind"
              (pointerdown)="startDrag($event, item.node.id, item.box)"
              (click)="selectNode($event, item.node.id)"
              (dblclick)="startEdit(item.node)"
            >
              @if (item.node.kind === 'decision') {
                <!-- el rombo va en SVG: con clip-path el recorte se come el borde, y el borde
                   negro es justo lo que dice «aquí se decide» en la referencia -->
                <svg
                  class="absolute inset-0 overflow-visible"
                  [attr.viewBox]="'0 0 ' + item.box.width + ' ' + item.box.height"
                  [attr.width]="item.box.width"
                  [attr.height]="item.box.height"
                >
                  <polygon
                    [attr.points]="diamondPoints(item.box)"
                    class="fill-card flow-diamond"
                    [class.stroke-primary]="isNodeSelected(item.node.id)"
                    [class.stroke-foreground]="!isNodeSelected(item.node.id)"
                    [attr.stroke-width]="isNodeSelected(item.node.id) ? 3 : 1.5"
                  />
                </svg>
              } @else {
                <div
                  class="bg-card flow-card absolute inset-0 rounded-[10px] border"
                  [class.ring-2]="isNodeSelected(item.node.id)"
                  [class.flow-card-start]="item.node.kind === 'start'"
                ></div>
              }

              <!-- asa de conexión: se ve al pasar por encima y se arrastra hasta otro bloque -->
              <button
                type="button"
                class="bg-primary ring-background absolute -right-2 top-1/2 z-20 size-3.5 -translate-y-1/2 cursor-crosshair rounded-full opacity-0 ring-2 transition-opacity group-hover:opacity-100"
                [attr.data-testid]="'flow-link-handle-' + item.node.id"
                title="Arrastra hasta otro bloque para conectarlos"
                (pointerdown)="startLink($event, item.node.id, item.box)"
              ></button>

              @if (editing() === item.node.id) {
                <div class="z-10 flex flex-col items-stretch gap-1" (click)="$event.stopPropagation()">
                  <input
                    class="border-input rounded border px-1.5 py-0.5 text-xs"
                    name="nodeText"
                    [ngModel]="item.node.text"
                    (ngModelChange)="store.updateFlowNode(activeName()!, item.node.id, { text: $event })"
                    (keydown.enter)="editing.set(null)"
                    data-testid="flow-node-text-input"
                  />
                  <select
                    class="border-input rounded border px-1 py-0.5 text-[10px]"
                    name="nodeEntity"
                    [ngModel]="item.node.entity ?? ''"
                    (ngModelChange)="setEntity(item.node.id, $event)"
                    data-testid="flow-node-entity-select"
                  >
                    <option value="">— sin entidad —</option>
                    @for (resource of store.resources(); track resource.name) {
                      <option [value]="resource.name">{{ resource.labelSingular }}</option>
                    }
                  </select>
                </div>
              } @else {
                <!-- como en la referencia: etiqueta de tipo arriba, el texto debajo, y el
                   número de orden en los pasos para leer el proceso «1, 2, 3» -->
                <span
                  class="z-10 flex min-w-0 items-center gap-2 px-1"
                  [class.justify-center]="item.node.kind === 'decision'"
                  [class.w-full]="item.node.kind === 'decision'"
                  [class.text-center]="item.node.kind === 'decision'"
                  [class.px-5]="item.node.kind === 'decision'"
                >
                  <span class="min-w-0">
                    @if (item.node.kind === 'decision') {
                      <span class="block text-[9px] font-semibold uppercase tracking-[0.12em] opacity-50">si</span>
                    }
                    @if (item.node.kind !== 'step' && item.node.kind !== 'decision') {
                      <span
                        class="block text-[9px] font-semibold uppercase tracking-[0.12em] opacity-60"
                        [attr.data-testid]="'flow-node-kind-' + item.node.id"
                      >
                        {{ kindLabel(item.node.kind) }}
                      </span>
                    }
                    <!-- dentro del rombo el ancho útil es poco: el texto se parte en líneas
                       en vez de cortarse, como el «stock < 10» de la referencia -->
                    <span
                      [class]="
                        item.node.kind === 'decision'
                          ? 'block text-[11px] font-semibold leading-tight'
                          : 'block truncate font-semibold leading-tight'
                      "
                      >{{ item.node.text }}</span
                    >
                    @if (item.node.entity) {
                      <span class="block truncate text-[11px] font-normal opacity-60">{{ item.node.entity }}</span>
                    }
                  </span>
                </span>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    /* Misma rejilla de PUNTOS que el lienzo de Modelo (decisión de Alfonso, 2026-08-11):
       los dos lienzos son el mismo papel, así que se dibujan igual. */
    .flow-grid {
      background-image: radial-gradient(
        circle,
        color-mix(in oklab, var(--foreground) 14%, transparent) 1.4px,
        transparent 1.4px
      );
      background-size: 24px 24px;
    }
    /* El rombo lleva la misma sombra que las píldoras: flota sobre el papel igual que ellas. */
    .flow-diamond {
      filter: drop-shadow(0 1px 2px oklch(0 0 0 / 8%)) drop-shadow(0 6px 14px oklch(0 0 0 / 10%));
    }
    /* Los nodos flotan sobre la rejilla, como las cajas del modelo. */
    .flow-card {
      box-shadow:
        0 1px 2px oklch(0 0 0 / 8%),
        0 6px 14px -6px oklch(0 0 0 / 14%),
        0 16px 32px -20px oklch(0 0 0 / 22%);
    }
    /* El arranque del proceso va en tinta: se ve de un vistazo por dónde empieza. */
    .flow-card-start {
      background-color: var(--foreground);
      border-color: transparent;
    }
  `
})
export class FlowViewComponent {
  protected readonly store = inject(DesignStore)
  protected readonly active = inject(ActiveViewService)
  private readonly viewport = inject(CanvasViewportService)
  protected readonly orientation = inject(FlowOrientationService)

  /** Posiciones arrastradas por flujo:nodo — SOLO memoria de sesión (layout cosmético). */
  private readonly manual = signal<Record<string, NodePosition>>({})

  protected readonly selected = signal<FlowSelection | null>(null)
  protected readonly editing = signal<string | null>(null)
  protected readonly linking = signal<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

  /** El flujo dibujado lo elige el raíl; aquí solo se lee. */
  protected readonly activeName = this.active.flow

  protected readonly activeFlow = computed<BusinessFlow | null>(
    () => this.store.flows().find(f => f.name === this.activeName()) ?? null
  )

  protected kindLabel(kind: FlowNodeKind): string {
    return KIND_LABELS[kind]
  }

  /** Las medidas de la tarjeta las manda el dominio: la geometría y el CSS no pueden discrepar. */
  protected readonly groupMetrics = FLOW_GROUP

  /**
   * Lo que se dibuja NO es el flujo tal cual: las acciones consecutivas se agrupan en
   * una tarjeta y el grafo se condensa (cada tarjeta cuenta como un vértice). Así el
   * lienzo tiene muchas menos flechas y las que quedan son las que importan.
   */
  private readonly diagram = computed(() => {
    const flow = this.activeFlow()
    if (!flow) return null
    const groups = flowGroups(flow)
    const condensed = flowCondensed(flow, groups)
    const rows = new Map(groups.map(group => [group.id, group.steps.length]))
    const positions = flowLayout(condensed, this.orientation.value(), this.frozenOf(flow.name), id => {
      const filas = rows.get(id)
      return filas === undefined ? undefined : flowGroupBox({ x: 0, y: 0 }, filas)
    })
    // sin start el layout viene vacío (el gate ya lo rechaza): que el lienzo no se caiga
    const at = (id: string) => positions[id] ?? { x: FLOW_GRID.margin, y: FLOW_GRID.margin }

    const cards = groups.map(group => ({ group, box: flowGroupBox(at(group.id), group.steps.length) }))
    const pills = condensed.nodes
      .filter(node => !rows.has(node.id))
      .map(node => ({ node, box: flowNodeBox(at(node.id), node.kind) }))

    return { condensed, cards, pills }
  })

  protected readonly cards = computed(() => this.diagram()?.cards ?? [])
  protected readonly pills = computed<FlowDiagramNode[]>(() => this.diagram()?.pills ?? [])

  /** Todas las cajas dibujadas, por el id que las representa en el grafo condensado. */
  private readonly boxes = computed<Map<string, NodeBox>>(() => {
    const diagram = this.diagram()
    return new Map([
      ...(diagram?.cards ?? []).map(card => [card.group.id, card.box] as const),
      ...(diagram?.pills ?? []).map(pill => [pill.node.id, pill.box] as const)
    ])
  })

  /** Los cuatro vértices del rombo, con 1px de margen para que el trazo no se recorte. */
  protected diamondPoints(box: NodeBox): string {
    return `${box.width / 2},1 ${box.width - 1},${box.height / 2} ${box.width / 2},${box.height - 1} 1,${box.height / 2}`
  }

  /** Posiciones ya colocadas de un flujo, sin el prefijo del nombre. */
  private frozenOf(flowName: string): Record<string, NodePosition> {
    return Object.fromEntries(
      Object.entries(this.manual())
        .filter(([key]) => key.startsWith(`${flowName}:`))
        .map(([key, pos]) => [key.slice(flowName.length + 1), pos])
    )
  }

  /**
   * Congela lo dibujado ANTES de tocar la topología. El layout por capas deduce la
   * posición de la distancia al inicio, así que borrar o insertar un paso movía de
   * columna a todo lo que venía detrás. Congelando primero, la edición solo coloca
   * lo nuevo y lo que ya estaba se queda donde el ojo lo tenía.
   */
  private freezePositions(): void {
    const flow = this.activeName()
    if (!flow) return
    const actuales = Object.fromEntries([...this.boxes()].map(([id, box]) => [`${flow}:${id}`, { x: box.x, y: box.y }]))
    this.manual.update(manual => ({ ...actuales, ...manual }))
  }

  protected readonly edges = computed<FlowDiagramEdge[]>(() => {
    const boxes = this.boxes()
    const dibujado = this.diagram()?.condensed
    const alternates = dibujado ? flowAlternateEdges(dibujado) : new Set<string>()
    return (dibujado?.edges ?? []).flatMap(edge => {
      const from = boxes.get(edge.from)
      const to = boxes.get(edge.to)
      return from && to
        ? [
            {
              from: edge.from,
              to: edge.to,
              ...(edge.label ? { label: edge.label } : {}),
              alternate: alternates.has(`${edge.from}→${edge.to}`),
              line: flowEdgeCurve(from, to, this.orientation.value())
            }
          ]
        : []
    })
  })

  /** Tamaño del SVG de aristas: cubre el contenido, ya no dimensiona el lienzo. */
  protected readonly surface = computed(() => canvasExtent([...this.boxes().values()]))

  private readonly viewportRef = viewChild<ElementRef<HTMLElement>>('viewportEl')
  protected readonly camera = this.viewport.of('flows')
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

  /** Arrastrar el PAPEL mueve la cámara; sobre un nodo o un control, no. */
  protected startPan(down: PointerEvent): void {
    if (down.button !== 0) return
    const target = down.target as HTMLElement
    // ni los bloques, ni los controles, ni las aristas: capturar el puntero aquí se comía su clic
    const interactivo =
      '[data-testid^="flow-node-"], [data-testid^="flow-card-"], [data-testid^="flow-edge-"], button, input, select, [data-testid="canvas-controls"]'
    if (target.closest(interactivo)) return

    const element = down.currentTarget as HTMLElement
    element.setPointerCapture(down.pointerId)
    this.panning.set(true)
    let last = { x: down.clientX, y: down.clientY }

    const onMove = (move: PointerEvent) => {
      this.viewport.panBy('flows', { x: move.clientX - last.x, y: move.clientY - last.y })
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
      this.viewport.zoomBy('flows', event.deltaY < 0 ? 1.08 : 1 / 1.08, punto)
      return
    }
    this.viewport.panBy('flows', { x: -event.deltaX, y: -event.deltaY })
  }

  protected fitToView(): void {
    const caja = this.viewportRef()?.nativeElement.getBoundingClientRect()
    if (!caja) return
    this.viewport.fit('flows', [...this.boxes().values()], { width: caja.width, height: caja.height })
  }

  /**
   * «+ Acción»: la acción nueva se cuelga del último paso de la tarjeta y queda elegida
   * y en edición, para escribirle el nombre sin buscar dónde pulsar.
   */
  protected addAction(group: FlowGroup): void {
    const flow = this.activeName()
    if (!flow) return
    this.freezePositions()
    const tail = group.steps[group.steps.length - 1]
    if (!this.store.appendFlowStep(flow, tail.id, 'Nueva acción')) return
    const creado = this.store
      .flows()
      .find(f => f.name === flow)
      ?.nodes.at(-1)
    if (!creado) return
    this.active.selectFlowNode(creado.id)
    this.selected.set({ kind: 'node', id: creado.id })
    this.editing.set(creado.id)
  }

  /** Quitar una fila de la tarjeta: es el mismo borrado con recosido de siempre. */
  protected removeStep(id: string): void {
    const flow = this.activeName()
    if (!flow) return
    this.freezePositions()
    this.inheritCardPosition(flow, id)
    if (this.store.removeFlowNode(flow, id)) this.forgetPosition(flow, id)
    if (this.selected()?.kind === 'node') this.selected.set(null)
  }

  /**
   * La tarjeta la representa su primer paso: si es ese el que se va, el siguiente hereda
   * su sitio. Sin esto, borrar la primera fila haría saltar la tarjeta a otra columna.
   */
  private inheritCardPosition(flowName: string, id: string): void {
    const card = this.cards().find(item => item.group.id === id)
    const heredero = card?.group.steps[1]
    if (!heredero) return
    this.manual.update(manual => ({ ...manual, [`${flowName}:${heredero.id}`]: { x: card.box.x, y: card.box.y } }))
  }

  protected selectNode(event: MouseEvent, id: string): void {
    event.stopPropagation()
    this.selected.set({ kind: 'node', id })
    // el inspector de la derecha edita lo elegido aquí
    this.active.selectFlowNode(id)
  }

  protected selectEdge(event: MouseEvent, edge: FlowDiagramEdge): void {
    event.stopPropagation()
    this.selected.set({ kind: 'edge', from: edge.from, to: edge.to, ...(edge.label ? { label: edge.label } : {}) })
    // una arista no se edita en el inspector: suelta el nodo para no mentir sobre qué hay elegido
    this.active.selectFlowNode(null)
  }

  protected isNodeSelected(id: string): boolean {
    const sel = this.selected()
    return sel?.kind === 'node' && sel.id === id
  }

  protected isEdgeSelected(edge: FlowDiagramEdge): boolean {
    const sel = this.selected()
    return sel?.kind === 'edge' && sel.from === edge.from && sel.to === edge.to && sel.label === edge.label
  }

  /**
   * Dónde pintar el botón de borrar: esquina del bloque o punto medio de la arista. Una
   * FILA de una tarjeta no tiene caja propia — se borra con la × de su fila, así que
   * aquí devuelve null y el botón flotante no aparece.
   */
  protected readonly deleteButtonAt = computed<NodePosition | null>(() => {
    const sel = this.selected()
    if (!sel) return null
    if (sel.kind === 'node') {
      const box = this.boxes().get(sel.id)
      return box ? { x: box.x + box.width, y: box.y } : null
    }
    const edge = this.edges().find(e => e.from === sel.from && e.to === sel.to && e.label === sel.label)
    return edge ? { x: (edge.line.x1 + edge.line.x2) / 2, y: (edge.line.y1 + edge.line.y2) / 2 + 12 } : null
  })

  protected deleteSelected(): void {
    const sel = this.selected()
    const name = this.activeName()
    if (!sel || !name) return
    if (sel.kind === 'node') return this.removeStep(sel.id)
    this.freezePositions()
    this.store.removeFlowEdge(name, sel.from, sel.to, sel.label)
    this.selected.set(null)
  }

  /** El hueco del nodo borrado no se reserva: un nodo futuro con su id no hereda su sitio. */
  private forgetPosition(flowName: string, id: string): void {
    this.manual.update(manual => {
      const { [`${flowName}:${id}`]: _, ...resto } = manual
      return resto
    })
  }

  protected onDeleteKey(event: Event): void {
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    this.deleteSelected()
  }

  protected startEdit(node: FlowNode): void {
    this.editing.set(node.id)
  }

  protected setEntity(id: string, entity: string): void {
    const name = this.activeName()
    if (!name) return
    // '' significa quitar la alusión: el patch debe DEJAR el campo fuera, no mandar cadena vacía
    this.store.updateFlowNode(name, id, entity ? { entity } : { entity: undefined })
  }

  /** Arrastre de bloques: igual que las cajas del modelo, posiciones en memoria. */
  protected startDrag(down: PointerEvent, id: string, box: NodeBox): void {
    if ((down.target as HTMLElement).closest('button, input, select')) return
    const flow = this.activeName()
    if (!flow) return
    down.preventDefault()
    const handle = down.currentTarget as HTMLElement
    handle.setPointerCapture(down.pointerId)
    const origin = { x: box.x, y: box.y }
    const key = `${flow}:${id}`

    const onMove = (move: PointerEvent) =>
      this.manual.update(manual => ({
        ...manual,
        [key]: {
          x: origin.x + (move.clientX - down.clientX) / this.camera().zoom,
          y: origin.y + (move.clientY - down.clientY) / this.camera().zoom
        }
      }))
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  /**
   * Conectar arrastrando: asa → flecha fantasma → soltar sobre otro bloque. Si el origen
   * es una decisión, la salida nace ya etiquetada ('sí' la primera, 'no' la segunda) y se
   * corrige después: defineApp exige la etiqueta en la frontera, pero pedirla con un
   * formulario en medio del gesto rompía el arrastre.
   */
  protected startLink(down: PointerEvent, id: string, box: NodeBox): void {
    down.preventDefault()
    down.stopPropagation()
    const handle = down.currentTarget as HTMLElement
    const surface = handle.closest('[data-testid="flow-surface"]') as HTMLElement | null
    if (!surface) return
    handle.setPointerCapture(down.pointerId)

    const originX = box.x + box.width
    const originY = box.y + box.height / 2
    // el MUNDO va escalado: el rect del `surface` ya viene multiplicado por el zoom, así
    // que sin dividir, el fantasma y el impacto se iban del cursor en cuanto había zoom
    const toWorld = (e: PointerEvent) => {
      const rect = surface.getBoundingClientRect()
      const zoom = this.camera().zoom
      return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }
    }
    const onMove = (move: PointerEvent) => {
      const point = toWorld(move)
      this.linking.set({ x1: originX, y1: originY, x2: point.x, y2: point.y })
    }
    const onUp = (up: PointerEvent) => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      this.linking.set(null)
      const point = toWorld(up)
      const target = nodeAt(point, Object.fromEntries(this.boxes()))
      const flow = this.activeName()
      if (!target || target === id || !flow) return
      // conectar también cambia las capas: congelar antes de que el grafo cambie
      this.freezePositions()
      this.store.addFlowEdge(flow, id, target, this.branchLabelFor(id))
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  /**
   * Etiqueta de una salida nueva: solo las decisiones la llevan, y la primera es el 'sí'
   * y la segunda el 'no' —el reparto que hace cualquiera al dibujar a mano—. De la tercera
   * en adelante se deja en blanco: ahí ya no hay convención que adivinar.
   */
  private branchLabelFor(from: string): string | undefined {
    const flow = this.activeFlow()
    const nodo = flow?.nodes.find(node => node.id === from)
    if (!flow || nodo?.kind !== 'decision') return undefined
    const salidas = flow.edges.filter(edge => edge.from === from).length
    return ['sí', 'no'][salidas] ?? ''
  }
}
