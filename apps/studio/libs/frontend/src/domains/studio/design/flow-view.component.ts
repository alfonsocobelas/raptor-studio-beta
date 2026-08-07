import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import type { BusinessFlow, FlowNode } from '@acc/schema'
import {
  FLOW_GRID,
  FLOW_NODE,
  edgeLine,
  flowLayout,
  flowNodeBox,
  type EdgeSegment,
  type NodeBox
} from '@app/shared/domain'
import { DesignStore } from './design-store'

interface FlowDiagramNode {
  node: FlowNode
  box: NodeBox
}

interface FlowDiagramEdge {
  from: string
  to: string
  label?: string
  line: EdgeSegment
}

/**
 * La vista de FLUJOS (spec 28): los procesos de negocio del diseño, dibujados.
 * Otra proyección del DesignStore — las cajas y flechas SON el BusinessFlow,
 * nunca un dibujo aparte. Solo lectura (TASK-04); la edición llega después.
 */
@Component({
  selector: 'studio-flow-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!store.flows().length) {
      <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-flows">
        <p class="text-muted-foreground mb-2 text-lg">Sin procesos todavía</p>
        <p class="text-muted-foreground max-w-md text-sm">
          Cuéntale al chat cómo trabaja el negocio («cuando llega un pedido…») y el proceso aparecerá aquí dibujado.
        </p>
      </div>
    } @else {
      <!-- selector del flujo activo -->
      <div class="mb-4 flex items-center gap-1" data-testid="flow-tabs">
        @for (flow of store.flows(); track flow.name) {
          <button
            type="button"
            class="rounded-md border px-3 py-1 text-xs font-medium"
            [class.bg-primary]="activeName() === flow.name"
            [class.text-primary-foreground]="activeName() === flow.name"
            [attr.data-testid]="'flow-tab-' + flow.name"
            (click)="active.set(flow.name)"
          >
            {{ flow.name }}
          </button>
        }
      </div>

      @if (activeFlow(); as flow) {
        @if (flow.description) {
          <p class="text-muted-foreground mb-3 max-w-2xl text-sm">{{ flow.description }}</p>
        }
        <div
          class="relative"
          [style.width.px]="surface().width"
          [style.height.px]="surface().height"
          data-testid="flow-surface"
        >
          <svg class="absolute inset-0 h-full w-full" data-testid="flow-edges">
            <defs>
              <marker id="flow-arrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 9 3.5, 0 7" class="fill-muted-foreground" />
              </marker>
            </defs>
            @for (item of edges(); track item.from + '→' + item.to + (item.label ?? '')) {
              <g [attr.data-testid]="'flow-edge-' + item.from + '-' + item.to">
                <line
                  [attr.x1]="item.line.x1"
                  [attr.y1]="item.line.y1"
                  [attr.x2]="item.line.x2"
                  [attr.y2]="item.line.y2"
                  class="stroke-muted-foreground"
                  stroke-width="1.5"
                  marker-end="url(#flow-arrow)"
                />
                @if (item.label) {
                  <text
                    [attr.x]="(item.line.x1 + item.line.x2) / 2"
                    [attr.y]="(item.line.y1 + item.line.y2) / 2 - 6"
                    text-anchor="middle"
                    class="fill-muted-foreground text-[10px] font-medium"
                  >
                    {{ item.label }}
                  </text>
                }
              </g>
            }
          </svg>

          @for (item of nodes(); track item.node.id) {
            <div
              class="absolute flex items-center justify-center px-3 text-center text-xs"
              [style.left.px]="item.box.x"
              [style.top.px]="item.box.y"
              [style.width.px]="item.box.width"
              [style.height.px]="item.box.height"
              [attr.data-testid]="'flow-node-' + item.node.id"
              [attr.data-kind]="item.node.kind"
            >
              <!-- la forma va detrás del texto: píldora, rectángulo o rombo según el kind -->
              @if (item.node.kind === 'decision') {
                <div
                  class="bg-card absolute inset-0 border shadow-sm"
                  style="clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"
                ></div>
              } @else {
                <div
                  class="bg-card absolute inset-0 border shadow-sm"
                  [class.rounded-full]="item.node.kind !== 'step'"
                  [class.rounded-md]="item.node.kind === 'step'"
                ></div>
              }
              <span class="text-foreground z-10 leading-tight">
                {{ item.node.text }}
                @if (item.node.entity) {
                  <span class="text-muted-foreground block text-[10px]">{{ item.node.entity }}</span>
                }
              </span>
            </div>
          }
        </div>
      }
    }
  `
})
export class FlowViewComponent {
  protected readonly store = inject(DesignStore)

  /** Flujo elegido en las pestañas; si desaparece, se cae al primero. */
  protected readonly active = signal<string | null>(null)

  protected readonly activeName = computed(() => {
    const chosen = this.active()
    const flows = this.store.flows()
    return flows.some(f => f.name === chosen) ? chosen : (flows[0]?.name ?? null)
  })

  protected readonly activeFlow = computed<BusinessFlow | null>(
    () => this.store.flows().find(f => f.name === this.activeName()) ?? null
  )

  protected readonly nodes = computed<FlowDiagramNode[]>(() => {
    const flow = this.activeFlow()
    if (!flow) return []
    const positions = flowLayout(flow)
    return flow.nodes.map(node => ({ node, box: flowNodeBox(positions[node.id]) }))
  })

  protected readonly edges = computed<FlowDiagramEdge[]>(() => {
    const boxes = new Map(this.nodes().map(n => [n.node.id, n.box]))
    return (this.activeFlow()?.edges ?? []).flatMap(edge => {
      const from = boxes.get(edge.from)
      const to = boxes.get(edge.to)
      return from && to
        ? [{ from: edge.from, to: edge.to, ...(edge.label ? { label: edge.label } : {}), line: edgeLine(from, to) }]
        : []
    })
  })

  /** El lienzo abarca todos los nodos del flujo activo, con margen para respirar. */
  protected readonly surface = computed(() => ({
    width: Math.max(...this.nodes().map(n => n.box.x + n.box.width), FLOW_NODE.width) + FLOW_GRID.margin,
    height: Math.max(...this.nodes().map(n => n.box.y + n.box.height), FLOW_NODE.height) + FLOW_GRID.margin
  }))
}
