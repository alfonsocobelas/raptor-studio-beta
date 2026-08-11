import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { BusinessFlow, FlowNode, FlowNodeKind } from '@acc/schema'
import {
  FLOW_GRID,
  FLOW_NODE,
  flowEdgeCurve,
  flowLayout,
  flowNodeBox,
  nodeAt,
  overlayLayout,
  type FlowEdgeCurve,
  type NodeBox,
  type NodePosition
} from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

interface FlowDiagramNode {
  node: FlowNode
  box: NodeBox
}

interface FlowDiagramEdge {
  from: string
  to: string
  label?: string
  line: FlowEdgeCurve
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
  imports: [FormsModule],
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
      <div class="flow-grid min-h-full min-w-full">
      <div
        class="relative"
        [style.width.px]="surface().width"
        [style.height.px]="surface().height"
        data-testid="flow-surface"
        (click)="selected.set(null)"
      >
        <svg class="absolute inset-0 h-full w-full" data-testid="flow-edges">
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
          </defs>
          @for (item of edges(); track item.from + '→' + item.to + (item.label ?? '')) {
            <g
              class="cursor-pointer"
              [attr.data-testid]="'flow-edge-' + item.from + '-' + item.to"
              (click)="selectEdge($event, item)"
            >
              <!-- zona de clic ancha e invisible: el trazo fino es imposible de acertar -->
              <path [attr.d]="item.line.d" fill="none" stroke="transparent" stroke-width="14" />
              <path
                [attr.d]="item.line.d"
                fill="none"
                [class]="isEdgeSelected(item) ? 'stroke-primary' : 'stroke-foreground'"
                [attr.stroke-width]="isEdgeSelected(item) ? 2.5 : 1.5"
                marker-end="url(#flow-arrow)"
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
                  [class]="'text-[10px] font-medium ' + (isEdgeSelected(item) ? 'fill-primary' : 'fill-muted-foreground')"
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
        @if (selected(); as sel) {
          <button
            type="button"
            class="bg-destructive text-destructive-foreground absolute z-20 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs leading-none shadow"
            [style.left.px]="deleteButtonAt().x"
            [style.top.px]="deleteButtonAt().y"
            data-testid="flow-delete-selected"
            title="Eliminar (Supr)"
            (click)="$event.stopPropagation(); deleteSelected()"
          >
            ×
          </button>
        }

        <!-- etiqueta pedida al salir de una decisión -->
        @if (pendingEdge(); as pending) {
          <form
            class="bg-popover absolute z-20 flex items-center gap-1 rounded-md border p-1 shadow-md"
            [style.left.px]="pending.x"
            [style.top.px]="pending.y"
            (ngSubmit)="confirmPendingEdge()"
          >
            <input
              class="border-input w-28 rounded border px-1.5 py-0.5 text-xs"
              name="edgeLabel"
              placeholder="Etiqueta (sí/no)…"
              [(ngModel)]="pendingLabel"
              data-testid="flow-edge-label-input"
            />
            <button type="submit" class="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">✓</button>
            <button type="button" class="text-muted-foreground text-xs" (click)="pendingEdge.set(null)">✕</button>
          </form>
        }

        @for (item of nodes(); track item.node.id) {
          <div
            class="group studio-ui absolute flex cursor-move items-center justify-center px-3 text-center"
            [class.text-background]="item.node.kind === 'start'"
            [style.left.px]="item.box.x"
            [style.top.px]="item.box.y"
            [style.width.px]="item.box.width"
            [style.height.px]="item.box.height"
            [attr.data-testid]="'flow-node-' + item.node.id"
            [attr.data-kind]="item.node.kind"
            (pointerdown)="startDrag($event, item)"
            (click)="selectNode($event, item.node.id)"
            (dblclick)="startEdit(item.node)"
          >
            @if (item.node.kind === 'decision') {
              <div
                class="bg-card flow-card absolute inset-0 border"
                [class.ring-2]="isNodeSelected(item.node.id)"
                style="clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"
              ></div>
            } @else {
              <div
                class="bg-card flow-card absolute inset-0 border"
                [class.ring-2]="isNodeSelected(item.node.id)"
                [class.rounded-full]="item.node.kind !== 'step'"
                [class.rounded-lg]="item.node.kind === 'step'"
                [class.flow-card-start]="item.node.kind === 'start'"
              ></div>
            }

            <!-- asa de conexión: arrastrar hasta otro nodo crea la arista -->
            <button
              type="button"
              class="bg-primary absolute -right-1.5 top-1/2 z-10 h-3 w-3 -translate-y-1/2 cursor-crosshair rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              [attr.data-testid]="'flow-link-handle-' + item.node.id"
              title="Arrastra hasta otro paso para conectarlos"
              (pointerdown)="startLink($event, item)"
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
              <span class="z-10 leading-tight">
                {{ item.node.text }}
                @if (item.node.entity) {
                  <span class="text-muted-foreground block text-[10px]">{{ item.node.entity }}</span>
                }
              </span>
            }
          </div>
        }
        </div>
      </div>
    }
  `,
  styles: `
    /* Misma rejilla que el diagrama de modelo: los dos lienzos son el mismo papel. */
    .flow-grid {
      background-image:
        linear-gradient(to right, color-mix(in oklab, var(--border) 65%, var(--background)) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in oklab, var(--border) 65%, var(--background)) 1px, transparent 1px);
      background-size: 24px 24px;
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

  /** Posiciones arrastradas por flujo:nodo — SOLO memoria de sesión (layout cosmético). */
  private readonly manual = signal<Record<string, NodePosition>>({})

  protected readonly selected = signal<FlowSelection | null>(null)
  protected readonly editing = signal<string | null>(null)
  protected readonly linking = signal<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  /** Arista a la espera de etiqueta (la salida de una decisión la exige). */
  protected readonly pendingEdge = signal<{ from: string; to: string; x: number; y: number } | null>(null)
  protected readonly pendingLabel = signal('')

  /** El flujo dibujado lo elige el raíl; aquí solo se lee. */
  protected readonly activeName = this.active.flow

  protected readonly activeFlow = computed<BusinessFlow | null>(
    () => this.store.flows().find(f => f.name === this.activeName()) ?? null
  )

  protected readonly nodes = computed<FlowDiagramNode[]>(() => {
    const flow = this.activeFlow()
    if (!flow) return []
    const auto = flowLayout(flow)
    const dragged = Object.fromEntries(
      Object.entries(this.manual())
        .filter(([key]) => key.startsWith(`${flow.name}:`))
        .map(([key, pos]) => [key.slice(flow.name.length + 1), pos])
    )
    const positions = overlayLayout(auto, dragged)
    return flow.nodes.map(node => ({ node, box: flowNodeBox(positions[node.id]) }))
  })

  protected readonly edges = computed<FlowDiagramEdge[]>(() => {
    const boxes = new Map(this.nodes().map(n => [n.node.id, n.box]))
    return (this.activeFlow()?.edges ?? []).flatMap(edge => {
      const from = boxes.get(edge.from)
      const to = boxes.get(edge.to)
      return from && to
        ? [{ from: edge.from, to: edge.to, ...(edge.label ? { label: edge.label } : {}), line: flowEdgeCurve(from, to) }]
        : []
    })
  })

  /** El lienzo abarca todos los nodos del flujo activo, con margen para respirar. */
  protected readonly surface = computed(() => ({
    width: Math.max(...this.nodes().map(n => n.box.x + n.box.width), FLOW_NODE.width) + FLOW_GRID.margin,
    height: Math.max(...this.nodes().map(n => n.box.y + n.box.height), FLOW_NODE.height) + FLOW_GRID.margin
  }))

  protected selectNode(event: MouseEvent, id: string): void {
    event.stopPropagation()
    this.selected.set({ kind: 'node', id })
  }

  protected selectEdge(event: MouseEvent, edge: FlowDiagramEdge): void {
    event.stopPropagation()
    this.selected.set({ kind: 'edge', from: edge.from, to: edge.to, ...(edge.label ? { label: edge.label } : {}) })
  }

  protected isNodeSelected(id: string): boolean {
    const sel = this.selected()
    return sel?.kind === 'node' && sel.id === id
  }

  protected isEdgeSelected(edge: FlowDiagramEdge): boolean {
    const sel = this.selected()
    return sel?.kind === 'edge' && sel.from === edge.from && sel.to === edge.to && sel.label === edge.label
  }

  /** Dónde pintar el botón de borrar: centro del nodo o punto medio de la arista. */
  protected readonly deleteButtonAt = computed<NodePosition>(() => {
    const sel = this.selected()
    if (!sel) return { x: 0, y: 0 }
    if (sel.kind === 'node') {
      const box = this.nodes().find(n => n.node.id === sel.id)?.box
      return box ? { x: box.x + box.width, y: box.y } : { x: 0, y: 0 }
    }
    const edge = this.edges().find(e => e.from === sel.from && e.to === sel.to && e.label === sel.label)
    return edge
      ? { x: (edge.line.x1 + edge.line.x2) / 2, y: (edge.line.y1 + edge.line.y2) / 2 + 12 }
      : { x: 0, y: 0 }
  })

  protected deleteSelected(): void {
    const sel = this.selected()
    const name = this.activeName()
    if (!sel || !name) return
    if (sel.kind === 'node') this.store.removeFlowNode(name, sel.id)
    else this.store.removeFlowEdge(name, sel.from, sel.to, sel.label)
    this.selected.set(null)
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

  /** Arrastre de nodos: igual que las cajas del modelo, posiciones en memoria. */
  protected startDrag(down: PointerEvent, item: FlowDiagramNode): void {
    if ((down.target as HTMLElement).closest('button, input, select')) return
    const flow = this.activeName()
    if (!flow) return
    down.preventDefault()
    const handle = down.currentTarget as HTMLElement
    handle.setPointerCapture(down.pointerId)
    const origin = { x: item.box.x, y: item.box.y }
    const key = `${flow}:${item.node.id}`

    const onMove = (move: PointerEvent) =>
      this.manual.update(manual => ({
        ...manual,
        [key]: { x: origin.x + move.clientX - down.clientX, y: origin.y + move.clientY - down.clientY }
      }))
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  /**
   * Conectar arrastrando: asa → flecha fantasma → soltar sobre otro nodo. Si el
   * origen es una decisión, la arista queda pendiente hasta escribir su etiqueta
   * (defineApp la exige en la frontera); en el resto se crea al soltar.
   */
  protected startLink(down: PointerEvent, item: FlowDiagramNode): void {
    down.preventDefault()
    down.stopPropagation()
    const handle = down.currentTarget as HTMLElement
    const surface = handle.closest('[data-testid="flow-surface"]') as HTMLElement | null
    if (!surface) return
    handle.setPointerCapture(down.pointerId)

    const originX = item.box.x + item.box.width
    const originY = item.box.y + item.box.height / 2
    const toSurface = (e: PointerEvent) => {
      const rect = surface.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMove = (move: PointerEvent) => {
      const point = toSurface(move)
      this.linking.set({ x1: originX, y1: originY, x2: point.x, y2: point.y })
    }
    const onUp = (up: PointerEvent) => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      this.linking.set(null)
      const point = toSurface(up)
      const target = nodeAt(point, Object.fromEntries(this.nodes().map(n => [n.node.id, n.box])))
      const flow = this.activeName()
      if (!target || target === item.node.id || !flow) return
      if (item.node.kind === 'decision') {
        this.pendingLabel.set('')
        this.pendingEdge.set({ from: item.node.id, to: target, x: point.x, y: point.y })
      } else {
        this.store.addFlowEdge(flow, item.node.id, target)
      }
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  protected confirmPendingEdge(): void {
    const pending = this.pendingEdge()
    const flow = this.activeName()
    if (!pending || !flow) return
    const label = this.pendingLabel().trim()
    if (!label) return
    if (this.store.addFlowEdge(flow, pending.from, pending.to, label)) {
      this.pendingEdge.set(null)
      this.pendingLabel.set('')
    }
  }
}
