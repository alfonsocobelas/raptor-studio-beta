import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import {
  MODEL_GRID,
  MODEL_NODE,
  autoLayout,
  edgeLine,
  modelEdges,
  nodeBox,
  type EdgeSegment,
  type ModelEdge,
  type NodeBox
} from '@app/shared/domain'
import { DesignStore } from './design-store'
import { TYPE_LABELS } from './field-type-labels'

interface DiagramNode {
  name: string
  label: string
  fields: { name: string; type: string }[]
  box: NodeBox
}

interface DiagramEdge {
  edge: ModelEdge
  line: EdgeSegment
}

/**
 * La vista de MODELO (spec 15, fase 4): otra proyección del DesignStore. Las
 * cajas son las entidades y cada flecha es un campo `ref` — derivadas siempre,
 * nunca almacenadas. El layout es cosmético y vive aquí, no en el diseño.
 */
@Component({
  selector: 'studio-model-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!nodes().length) {
      <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-model">
        <p class="text-muted-foreground mb-2 text-lg">Sin entidades todavía</p>
        <p class="text-muted-foreground max-w-md text-sm">
          Crea una vista con datos (o pídesela al chat) y su entidad aparecerá aquí como una caja.
        </p>
      </div>
    } @else {
      <div class="relative" [style.width.px]="surface().width" [style.height.px]="surface().height">
        <svg class="absolute inset-0 h-full w-full" data-testid="model-edges">
          <defs>
            <marker id="model-arrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0, 9 3.5, 0 7" class="fill-muted-foreground" />
            </marker>
          </defs>
          @for (item of edges(); track item.edge.from + '-' + item.edge.fieldIndex) {
            <g [attr.data-testid]="'edge-' + item.edge.from + '-' + item.edge.to">
              <line
                [attr.x1]="item.line.x1"
                [attr.y1]="item.line.y1"
                [attr.x2]="item.line.x2"
                [attr.y2]="item.line.y2"
                class="stroke-muted-foreground"
                stroke-width="1.5"
                marker-end="url(#model-arrow)"
              />
              <text
                [attr.x]="(item.line.x1 + item.line.x2) / 2"
                [attr.y]="(item.line.y1 + item.line.y2) / 2 - 6"
                text-anchor="middle"
                class="fill-muted-foreground text-[10px]"
              >
                {{ item.edge.label }}
              </text>
            </g>
          }
        </svg>

        @for (node of nodes(); track node.name) {
          <div
            class="bg-card absolute rounded-md border shadow-sm"
            [style.left.px]="node.box.x"
            [style.top.px]="node.box.y"
            [style.width.px]="node.box.width"
            [attr.data-testid]="'model-node-' + node.name"
          >
            <header
              class="flex items-center border-b px-3 text-sm font-semibold"
              [style.height.px]="headerHeight"
            >
              {{ node.label }}
            </header>
            @for (field of node.fields; track field.name) {
              <div
                class="text-muted-foreground flex items-center justify-between px-3 text-xs"
                [style.height.px]="rowHeight"
              >
                <span class="text-foreground truncate">{{ field.name }}</span>
                <span class="ml-2 shrink-0">{{ field.type }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class ModelViewComponent {
  protected readonly store = inject(DesignStore)
  protected readonly headerHeight = MODEL_NODE.headerHeight
  protected readonly rowHeight = MODEL_NODE.rowHeight

  private readonly positions = computed(() => autoLayout(this.store.resources().map(r => r.name)))

  protected readonly nodes = computed<DiagramNode[]>(() =>
    this.store.resources().map(resource => ({
      name: resource.name,
      label: resource.labelSingular,
      fields: resource.fields.map(f => ({
        name: f.name,
        type: f.type === 'ref' && f.refTo ? `→ ${f.refTo}` : TYPE_LABELS[f.type]
      })),
      box: nodeBox(this.positions()[resource.name], resource.fields.length)
    }))
  )

  protected readonly edges = computed<DiagramEdge[]>(() => {
    const boxes = new Map(this.nodes().map(n => [n.name, n.box]))
    return modelEdges(this.store.resources()).flatMap(edge => {
      const from = boxes.get(edge.from)
      const to = boxes.get(edge.to)
      return from && to ? [{ edge, line: edgeLine(from, to) }] : []
    })
  })

  /** El lienzo abarca todas las cajas; con margen para que la última respire. */
  protected readonly surface = computed(() => ({
    width: Math.max(...this.nodes().map(n => n.box.x + n.box.width), 0) + MODEL_GRID.margin,
    height: Math.max(...this.nodes().map(n => n.box.y + n.box.height), 0) + MODEL_GRID.margin
  }))
}
