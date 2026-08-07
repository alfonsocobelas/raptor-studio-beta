import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import {
  MODEL_GRID,
  MODEL_NODE,
  autoLayout,
  edgeLine,
  modelEdges,
  nodeAt,
  nodeBox,
  overlayLayout,
  type EdgeSegment,
  type ModelEdge,
  type NodeBox,
  type NodePosition
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
      <div
        #surfaceEl
        class="relative"
        [style.width.px]="surface().width"
        [style.height.px]="surface().height"
        data-testid="model-surface"
      >
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
          <!-- flecha fantasma mientras se arrastra un enlace -->
          @if (linking(); as ghost) {
            <line
              [attr.x1]="ghost.x1"
              [attr.y1]="ghost.y1"
              [attr.x2]="ghost.x2"
              [attr.y2]="ghost.y2"
              class="stroke-primary"
              stroke-width="1.5"
              stroke-dasharray="5 4"
              marker-end="url(#model-arrow)"
              data-testid="ghost-edge"
            />
          }
        </svg>

        @for (node of nodes(); track node.name) {
          <div
            class="bg-card group absolute rounded-md border shadow-sm"
            [class.ring-2]="linking()?.from === node.name"
            [style.left.px]="node.box.x"
            [style.top.px]="node.box.y"
            [style.width.px]="node.box.width"
            [attr.data-testid]="'model-node-' + node.name"
          >
            <!-- asa de enlace: arrastrar hasta otra caja crea la relación -->
            <button
              type="button"
              class="bg-primary absolute -right-1.5 z-10 h-3 w-3 cursor-crosshair rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              [style.top.px]="headerHeight / 2 - 6"
              [attr.data-testid]="'link-handle-' + node.name"
              title="Arrastra hasta otra entidad para crear una relación"
              (pointerdown)="startLink($event, node.name)"
            ></button>
            <header
              class="flex cursor-move select-none items-center border-b px-3 text-sm font-semibold"
              [style.height.px]="headerHeight"
              [attr.data-testid]="'model-node-header-' + node.name"
              (pointerdown)="startDrag($event, node.name)"
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

  /** Posiciones arrastradas: SOLO memoria de la sesión — el layout es cosmético (spec 15 §4). */
  private readonly manual = signal<Record<string, NodePosition>>({})

  private readonly positions = computed(() =>
    overlayLayout(autoLayout(this.store.resources().map(r => r.name)), this.manual())
  )

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

  /** Enlace en curso: origen + segmento de la flecha fantasma (coords del lienzo). */
  protected readonly linking = signal<{ from: string; x1: number; y1: number; x2: number; y2: number } | null>(null)

  /**
   * Crear relación arrastrando: el asa captura el puntero, la flecha fantasma
   * sigue al cursor y al soltar sobre otra caja se llama a addRelation — el
   * campo `ref` real. Soltar en el vacío (o sobre la misma caja) cancela.
   */
  protected startLink(down: PointerEvent, from: string): void {
    down.preventDefault()
    down.stopPropagation()
    const handle = down.currentTarget as HTMLElement
    const surface = handle.closest('[data-testid="model-surface"]') as HTMLElement
    handle.setPointerCapture(down.pointerId)

    const box = this.nodes().find(n => n.name === from)?.box
    if (!box || !surface) return
    const originX = box.x + box.width
    const originY = box.y + MODEL_NODE.headerHeight / 2

    const toSurface = (e: PointerEvent) => {
      const rect = surface.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onMove = (move: PointerEvent) => {
      const point = toSurface(move)
      this.linking.set({ from, x1: originX, y1: originY, x2: point.x, y2: point.y })
    }
    const onUp = (up: PointerEvent) => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
      this.linking.set(null)
      const target = nodeAt(toSurface(up), Object.fromEntries(this.nodes().map(n => [n.name, n.box])))
      if (target && target !== from) this.store.addRelation(from, target)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  /**
   * Arrastre con pointer capture: la cabecera captura el puntero y las
   * posiciones se acumulan en `manual` — nunca tocan el diseño ni el store.
   */
  protected startDrag(down: PointerEvent, name: string): void {
    down.preventDefault()
    const handle = down.currentTarget as HTMLElement
    handle.setPointerCapture(down.pointerId)
    const origin = this.positions()[name]

    const onMove = (move: PointerEvent) =>
      this.manual.update(manual => ({
        ...manual,
        [name]: { x: origin.x + move.clientX - down.clientX, y: origin.y + move.clientY - down.clientY }
      }))
    const onUp = () => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', onUp)
    }
    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', onUp)
  }

  /** El lienzo abarca todas las cajas; con margen para que la última respire. */
  protected readonly surface = computed(() => ({
    width: Math.max(...this.nodes().map(n => n.box.x + n.box.width), 0) + MODEL_GRID.margin,
    height: Math.max(...this.nodes().map(n => n.box.y + n.box.height), 0) + MODEL_GRID.margin
  }))
}
