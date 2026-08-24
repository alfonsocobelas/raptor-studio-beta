import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { STATE_NODE, stateDiagram } from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

/** Lo elegido dentro del diagrama: una flecha (verbo+origen) o un estado. */
type StateSelection = { kind: 'edge'; name: string; from: string } | { kind: 'node'; value: string } | null

/**
 * El ciclo de vida de la entidad elegida (spec 43): los valores del enum promovido como
 * cajas y cada transición como flecha con su verbo. Editable entero: arrastrar un asa
 * crea transiciones, el editor inline renombra verbo y botón, Supr borra la flecha y un
 * estado elegido puede hacerse inicial. Vive dentro de la sub-vista de ciclo de vida
 * (lienzo con pan/zoom), por eso los gestos des-escalan contra el tamaño real del SVG.
 *
 * Deriva todo del store (sin inputs): así se monta en el runner JIT y sobrevive a
 * cualquier reordenación de la vista del modelo.
 */
@Component({
  selector: 'studio-state-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.delete)': 'onDeleteKey($event)', '(document:keydown.backspace)': 'onDeleteKey($event)' },
  template: `
    @if (view(); as v) {
      <div class="bg-card rounded-lg border p-4 shadow-sm" data-testid="state-diagram">
        <p class="studio-eyebrow mb-1">Ciclo de vida · {{ v.fieldLabel }}</p>
        <p class="text-muted-foreground mb-3 text-xs">
          Cada registro nace en el valor con anillo; solo los saltos dibujados están permitidos.
        </p>
        <svg [attr.width]="v.width + 16" [attr.height]="v.height" class="overflow-visible">
          <defs>
            <marker
              id="state-arrow"
              markerWidth="13"
              markerHeight="12"
              refX="10"
              refY="6"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M3,2 L10,6 L3,10" fill="none" stroke="currentColor" stroke-width="1.6" />
            </marker>
          </defs>
          @for (edge of v.edges; track edge.key) {
            <g
              class="cursor-pointer"
              [class.text-muted-foreground]="!isEdgeChosen(edge.name, edge.from)"
              [attr.data-selected]="isEdgeChosen(edge.name, edge.from) || null"
              [style.color]="isEdgeChosen(edge.name, edge.from) ? '#f15539' : null"
              [attr.data-testid]="'state-edge-' + edge.key"
              (click)="chooseEdge(edge.name, edge.from, $event)"
            >
              <!-- trazo invisible más gordo: la flecha fina sería imposible de pinchar -->
              <path [attr.d]="edge.path" fill="none" stroke="transparent" stroke-width="12" />
              <path [attr.d]="edge.path" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#state-arrow)" />
              <text
                [attr.x]="edge.labelX"
                [attr.y]="edge.labelY"
                text-anchor="middle"
                class="fill-current text-[10px] font-medium"
              >
                {{ edge.label }}
              </text>
            </g>
          }
          @if (ghost(); as line) {
            <line
              [attr.x1]="line.x1"
              [attr.y1]="line.y1"
              [attr.x2]="line.x2"
              [attr.y2]="line.y2"
              stroke="#f15539"
              stroke-width="1.4"
              stroke-dasharray="5 4"
              data-testid="state-ghost-edge"
            />
          }
          @for (node of v.nodes; track node.value) {
            <g
              [attr.data-testid]="'state-node-' + node.value"
              [attr.data-unreachable]="node.unreachable || null"
              [attr.data-selected]="isNodeChosen(node.value) || null"
              (click)="chooseNode(node.value, $event)"
            >
              @if (node.initial) {
                <!-- el anillo del estado inicial: donde nace todo registro -->
                <rect
                  [attr.x]="node.x - 4"
                  [attr.y]="node.y - 4"
                  [attr.width]="nodeWidth + 8"
                  [attr.height]="nodeHeight + 8"
                  rx="12"
                  fill="none"
                  stroke="#f15539"
                  stroke-width="1.4"
                  data-testid="state-initial"
                />
              }
              <rect
                [attr.x]="node.x"
                [attr.y]="node.y"
                [attr.width]="nodeWidth"
                [attr.height]="nodeHeight"
                rx="9"
                class="fill-background stroke-border"
                [attr.stroke-dasharray]="node.unreachable ? '4 3' : null"
                stroke-width="1.2"
              />
              <text
                [attr.x]="node.x + nodeWidth / 2"
                [attr.y]="node.y + nodeHeight / 2 + 4"
                text-anchor="middle"
                class="fill-foreground text-xs font-semibold"
              >
                {{ node.label }}
              </text>
              <!-- el asa: arrastrar desde aquí tiende la flecha fantasma hasta otro estado -->
              <circle
                [attr.cx]="node.x + nodeWidth"
                [attr.cy]="node.y + nodeHeight / 2"
                r="6"
                class="fill-background cursor-crosshair"
                stroke="#f15539"
                stroke-width="1.4"
                [attr.data-testid]="'state-handle-' + node.value"
                (pointerdown)="startLink($event, node.value)"
              />
            </g>
          }
        </svg>
        @if (chosen(); as selection) {
          <div class="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" data-testid="state-editor">
            @if (selection.kind === 'edge') {
              <label class="studio-ui text-muted-foreground">Verbo</label>
              <input
                class="border-input bg-card studio-ui w-36 rounded-md border px-2 py-1"
                [value]="selection.name"
                (change)="renameEdge($event)"
                data-testid="state-edit-name"
              />
              <label class="studio-ui text-muted-foreground">Botón</label>
              <input
                class="border-input bg-card studio-ui w-36 rounded-md border px-2 py-1"
                [value]="chosenLabel()"
                (change)="relabelEdge($event)"
                data-testid="state-edit-label"
              />
              <span class="text-muted-foreground studio-ui">Supr borra la flecha</span>
            } @else {
              <button
                type="button"
                class="studio-cta border-input border"
                data-testid="state-make-initial"
                (click)="makeInitial()"
              >
                Estado inicial
              </button>
            }
          </div>
        }
        @if (v.loose.length) {
          <p class="mt-2 text-xs text-amber-600" data-testid="state-warning">
            Ninguna flecha llega a: {{ v.loose.join(', ') }}. Se puede generar igual; dibuja cómo se alcanza o
            elimínalo del enum.
          </p>
        }
      </div>
    }
  `
})
export class StateDiagramComponent {
  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly nodeWidth = STATE_NODE.width
  protected readonly nodeHeight = STATE_NODE.height

  protected readonly chosen = signal<StateSelection>(null)
  /** La flecha fantasma mientras se arrastra desde un asa. */
  protected readonly ghost = signal<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  private linkingFrom: string | null = null

  private resourceName(): string | null {
    return this.active.resource()
  }

  protected isEdgeChosen(name: string, from: string): boolean {
    const current = this.chosen()
    return current?.kind === 'edge' && current.name === name && current.from === from
  }

  protected isNodeChosen(value: string): boolean {
    const current = this.chosen()
    return current?.kind === 'node' && current.value === value
  }

  protected chooseEdge(name: string, from: string, event: Event): void {
    event.stopPropagation()
    this.chosen.set({ kind: 'edge', name, from })
  }

  protected chooseNode(value: string, event: Event): void {
    event.stopPropagation()
    this.chosen.set({ kind: 'node', value })
  }

  /** El label actual del verbo elegido, leído del diseño (no se guarda copia). */
  protected chosenLabel(): string {
    const current = this.chosen()
    if (current?.kind !== 'edge') return ''
    const machine = this.store.resources().find(r => r.name === this.resourceName())?.state
    return machine?.transitions.find(t => t.name === current.name)?.label ?? ''
  }

  /**
   * Arrastre desde el asa (patrón startLink del editor de flujos): con la captura del
   * puntero, el pointerup NUNCA llega al nodo destino — se escucha en window y el
   * destino se resuelve por COORDENADAS contra el layout, como hace flow-view.
   */
  protected startLink(event: PointerEvent, from: string): void {
    event.preventDefault()
    event.stopPropagation()
    const handle = event.target as Element & { setPointerCapture?: (id: number) => void; closest: Element['closest'] }
    handle.setPointerCapture?.(event.pointerId)
    const svg = handle.closest('svg')
    this.linkingFrom = from

    const node = this.view()?.nodes.find(n => n.value === from)
    const originX = node ? node.x + this.nodeWidth : 0
    const originY = node ? node.y + this.nodeHeight / 2 : 0
    this.ghost.set({ x1: originX, y1: originY, x2: originX, y2: originY })

    const toWorld = (e: PointerEvent): { x: number; y: number } => {
      const rect = svg?.getBoundingClientRect()
      if (!rect) return { x: 0, y: 0 }
      // bajo el zoom de la sub-vista el rect viene escalado: se divide por la escala real
      const declared = (this.view()?.width ?? 0) + 16
      const scale = rect.width > 0 && declared > 0 ? rect.width / declared : 1
      return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale }
    }
    const onMove = (move: PointerEvent): void => {
      const point = toWorld(move)
      this.ghost.set({ x1: originX, y1: originY, x2: point.x, y2: point.y })
    }
    const cerrar = (): void => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', cerrar)
      this.ghost.set(null)
      this.linkingFrom = null
    }
    const onUp = (up: PointerEvent): void => {
      const to = this.nodeAt(toWorld(up))
      const resource = this.resourceName()
      if (to && to !== from && resource) {
        this.store.addTransition(resource, from, to)
      }
      cerrar()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', cerrar)
  }

  /** ¿Qué estado hay bajo el punto? Margen pequeño: acertar al píxel era lo difícil. */
  private nodeAt(point: { x: number; y: number }): string | null {
    const margin = 8
    for (const node of this.view()?.nodes ?? []) {
      if (
        point.x >= node.x - margin &&
        point.x <= node.x + this.nodeWidth + margin &&
        point.y >= node.y - margin &&
        point.y <= node.y + this.nodeHeight + margin
      ) {
        return node.value
      }
    }
    return null
  }

  protected renameEdge(event: Event): void {
    const current = this.chosen()
    const resource = this.resourceName()
    if (current?.kind !== 'edge' || !resource) return
    const name = (event.target as HTMLInputElement).value.trim()
    if (this.store.updateTransition(resource, current.name, { name })) {
      this.chosen.set({ ...current, name })
    }
  }

  protected relabelEdge(event: Event): void {
    const current = this.chosen()
    const resource = this.resourceName()
    if (current?.kind !== 'edge' || !resource) return
    this.store.updateTransition(resource, current.name, { label: (event.target as HTMLInputElement).value })
  }

  protected makeInitial(): void {
    const current = this.chosen()
    const resource = this.resourceName()
    if (current?.kind !== 'node' || !resource) return
    this.store.setInitialState(resource, current.value)
  }

  protected onDeleteKey(event: Event): void {
    // teclear en un input (el editor de verbo/label) jamás borra la flecha (canon flow-view)
    const target = event.target as HTMLElement | null
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
    const current = this.chosen()
    const resource = this.resourceName()
    if (current?.kind !== 'edge' || !resource) return
    if (this.store.removeTransition(resource, current.name, current.from)) {
      this.chosen.set(null)
    }
  }

  protected readonly view = computed(() => {
    const resource = this.store.resources().find(r => r.name === this.active.resource())
    const machine = resource?.state
    const field = resource?.fields.find(f => f.name === machine?.field)
    if (!resource || !machine || !field?.values?.length) return null

    const layout = stateDiagram(machine, field.values)
    return {
      ...layout,
      fieldLabel: field.label,
      loose: layout.nodes.filter(node => node.unreachable).map(node => node.label)
    }
  })
}
