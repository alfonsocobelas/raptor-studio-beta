import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { flowToProse } from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

const KIND_LABELS: Record<string, string> = {
  start: 'inicio',
  step: 'paso',
  decision: 'decisión',
  end: 'fin'
}

/**
 * Panel derecho del modo Flujos: el nodo elegido y el flujo contado en prosa.
 * Solo texto y entidad, que es lo que un FlowNode guarda — ni condiciones con
 * operadores ni esperas: un flujo viaja como contexto, no como automatización.
 */
@Component({
  selector: 'studio-flow-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-0 flex-col gap-5 overflow-y-auto">
      <section>
        <h2 class="studio-eyebrow mb-3">Nodo seleccionado</h2>

        @if (node(); as current) {
          <div class="studio-row">
            <label for="flow-node-text">Texto</label>
            <input id="flow-node-text" [value]="current.text" (input)="rename($event)" data-testid="flow-node-text" />
          </div>

          <div class="studio-row">
            <label for="flow-node-entity">Entidad</label>
            <select id="flow-node-entity" [value]="current.entity ?? ''" (change)="repoint($event)" data-testid="flow-node-entity">
              <option value="">— ninguna —</option>
              @for (resource of store.resources(); track resource.name) {
                <option [value]="resource.name">{{ resource.labelSingular }}</option>
              }
            </select>
          </div>

          <div class="studio-row">
            <label>Tipo</label>
            <span class="studio-ui text-muted-foreground" data-testid="flow-node-kind">{{ kindLabel(current.kind) }}</span>
          </div>

          @if (current.kind !== 'start') {
            <button
              type="button"
              class="text-destructive hover:border-destructive/50 mt-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
              data-testid="flow-node-delete"
              (click)="remove()"
            >
              Borrar nodo
            </button>
          } @else {
            <p class="text-muted-foreground mt-2 text-xs">
              El inicio no se borra: es por donde el proceso arranca.
            </p>
          }
        } @else {
          <p class="text-muted-foreground text-xs" data-testid="flow-node-empty">
            Elige un nodo en el diagrama y aquí aparecerán su texto y su entidad.
          </p>
        }
      </section>

      <section>
        <h2 class="studio-eyebrow mb-2">Vista de texto</h2>
        <p class="studio-ui text-muted-foreground" data-testid="flow-prose">{{ prose() }}</p>
        <p class="text-muted-foreground mt-2 text-xs">
          Así se lee lo dibujado. El proceso viaja con el diseño y aterriza como contexto en la app generada; no
          genera código.
        </p>
      </section>
    </div>
  `
})
export class FlowPanelComponent {
  protected readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  private readonly flow = computed(() => this.store.flows().find(flow => flow.name === this.active.flow()) ?? null)

  protected readonly node = computed(() => {
    const id = this.active.flowNode()
    return id ? (this.flow()?.nodes.find(node => node.id === id) ?? null) : null
  })

  protected readonly prose = computed(() => {
    const flow = this.flow()
    return flow ? flowToProse(flow) : 'Todavía no hay ningún flujo dibujado.'
  })

  protected kindLabel(kind: string): string {
    return KIND_LABELS[kind] ?? kind
  }

  protected rename(event: Event): void {
    const flow = this.flow()
    const node = this.node()
    if (flow && node) this.store.updateFlowNode(flow.name, node.id, { text: (event.target as HTMLInputElement).value })
  }

  protected repoint(event: Event): void {
    const flow = this.flow()
    const node = this.node()
    const entity = (event.target as HTMLSelectElement).value
    if (flow && node) this.store.updateFlowNode(flow.name, node.id, { entity: entity || undefined })
  }

  protected remove(): void {
    const flow = this.flow()
    const node = this.node()
    if (!flow || !node) return
    if (this.store.removeFlowNode(flow.name, node.id)) this.active.selectFlowNode(null)
  }
}
