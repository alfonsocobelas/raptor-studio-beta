import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
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
  imports: [FormsModule],
  host: { '(document:keydown.delete)': 'onDeleteKey($event)' },
  template: `
    <!-- crear entidades SIN salir del diagrama: el modelo también se dibuja aquí -->
    <div class="mb-4 flex items-center gap-1">
      @if (creating()) {
        <form class="flex items-center gap-1" (ngSubmit)="confirmEntity()">
          <input
            class="border-input w-44 rounded-md border px-2 py-1 text-sm"
            name="entityName"
            placeholder="Nombre de la entidad…"
            [(ngModel)]="entityName"
            data-testid="model-new-entity-name"
          />
          <button
            type="submit"
            class="bg-primary text-primary-foreground rounded-md px-2 py-1 text-sm"
            data-testid="model-new-entity-ok"
          >
            Crear
          </button>
          <button type="button" class="text-muted-foreground text-sm" (click)="creating.set(false)">✕</button>
        </form>
      } @else {
        <button type="button" class="toolbar-chip" data-testid="model-new-entity" (click)="creating.set(true)">
          + Entidad
        </button>
        <span class="text-muted-foreground text-xs">
          arrastra del asa de una caja a otra para relacionarlas · la vista de listado se añade en Vistas
        </span>
      }
    </div>

    @if (!nodes().length) {
      <div class="flex h-full flex-col items-center justify-center text-center" data-testid="empty-model">
        <p class="text-muted-foreground mb-2 text-lg">Sin entidades todavía</p>
        <p class="text-muted-foreground max-w-md text-sm">
          Crea una con <strong>+ Entidad</strong>, con una vista de datos o pidiéndosela al chat.
        </p>
      </div>
    } @else {
      <div
        #surfaceEl
        class="relative"
        [style.width.px]="surface().width"
        [style.height.px]="surface().height"
        data-testid="model-surface"
        (click)="selected.set(null)"
      >
        <svg class="absolute inset-0 h-full w-full" data-testid="model-edges">
          <defs>
            <marker id="model-arrow" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <polygon points="0 0, 9 3.5, 0 7" class="fill-muted-foreground" />
            </marker>
          </defs>
          @for (item of edges(); track item.edge.from + '-' + item.edge.fieldIndex) {
            <g
              class="cursor-pointer"
              [attr.data-testid]="'edge-' + item.edge.from + '-' + item.edge.to"
              (click)="selectEdge($event, item.edge)"
            >
              <!-- zona de clic ancha e invisible: la línea de 1.5px es imposible de acertar -->
              <line
                [attr.x1]="item.line.x1"
                [attr.y1]="item.line.y1"
                [attr.x2]="item.line.x2"
                [attr.y2]="item.line.y2"
                stroke="transparent"
                stroke-width="12"
              />
              <line
                [attr.x1]="item.line.x1"
                [attr.y1]="item.line.y1"
                [attr.x2]="item.line.x2"
                [attr.y2]="item.line.y2"
                [class]="isSelected(item.edge) ? 'stroke-primary' : 'stroke-muted-foreground'"
                [attr.stroke-width]="isSelected(item.edge) ? 2.5 : 1.5"
                marker-end="url(#model-arrow)"
              />
              <text
                [attr.x]="(item.line.x1 + item.line.x2) / 2"
                [attr.y]="(item.line.y1 + item.line.y2) / 2 - 6"
                text-anchor="middle"
                [class]="'text-[10px] ' + (isSelected(item.edge) ? 'fill-primary' : 'fill-muted-foreground')"
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

        <!-- botón de borrado de la flecha seleccionada (también responde la tecla Supr) -->
        @if (selectedEdge(); as sel) {
          <button
            type="button"
            class="bg-destructive text-destructive-foreground absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs leading-none shadow"
            [style.left.px]="(sel.line.x1 + sel.line.x2) / 2"
            [style.top.px]="(sel.line.y1 + sel.line.y2) / 2 + 10"
            data-testid="delete-edge"
            title="Eliminar relación (Supr)"
            (click)="$event.stopPropagation(); deleteSelected()"
          >
            ×
          </button>
        }

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
  `,
  styles: `
    .toolbar-chip {
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      transition: background-color 0.15s;
    }
    .toolbar-chip:hover {
      background-color: var(--accent);
    }
  `
})
export class ModelViewComponent {
  protected readonly store = inject(DesignStore)

  protected readonly creating = signal(false)
  protected readonly entityName = signal('')

  /** Entidad suelta desde el diagrama: mismo camino (y mismo gate) que el resto del lienzo. */
  protected confirmEntity(): void {
    const label = this.entityName().trim()
    if (!label) return
    if (this.store.addResource(label)) {
      this.creating.set(false)
      this.entityName.set('')
    }
  }
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

  /** Flecha seleccionada, por identidad del campo ref que la origina. */
  protected readonly selected = signal<{ from: string; fieldIndex: number } | null>(null)

  /** La selección resuelta contra las aristas vivas: si la flecha ya no existe, no hay selección. */
  protected readonly selectedEdge = computed(() => {
    const sel = this.selected()
    return sel ? (this.edges().find(e => this.matches(e.edge, sel)) ?? null) : null
  })

  /** Supr borra la flecha seleccionada — salvo que el usuario esté escribiendo en un campo. */
  protected onDeleteKey(event: Event): void {
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    this.deleteSelected()
  }

  protected selectEdge(event: MouseEvent, edge: ModelEdge): void {
    event.stopPropagation()
    this.selected.set({ from: edge.from, fieldIndex: edge.fieldIndex })
  }

  protected isSelected(edge: ModelEdge): boolean {
    const sel = this.selected()
    return sel !== null && this.matches(edge, sel)
  }

  /** Borrar la flecha es borrar su campo ref: la mutación (y su gate) ya viven en el store. */
  protected deleteSelected(): void {
    const sel = this.selectedEdge()
    if (!sel) return
    this.store.removeRelation(sel.edge.from, sel.edge.fieldIndex)
    this.selected.set(null)
  }

  private matches(edge: ModelEdge, sel: { from: string; fieldIndex: number }): boolean {
    return edge.from === sel.from && edge.fieldIndex === sel.fieldIndex
  }

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
