import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FLOW_LIMITS, type FlowNodeKind } from '@raptor/schema'
import { FormsModule } from '@angular/forms'
import { FLOW_KIND_LABELS, flowToProse } from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

/**
 * Valor de la opción «— ninguna —». No vale la cadena vacía: el desplegable la trata como
 * «nada elegido» y el disparador se queda en blanco en vez de decir que no hay entidad
 * (probado: con '' el test del disparador lee '').
 */
const NONE = '__ninguna__'

function chosen(value: string): string | undefined {
  return value === NONE ? undefined : value
}

/**
 * Panel derecho del modo Flujos: el nodo elegido y el flujo contado en prosa.
 * Solo texto y entidad, que es lo que un FlowNode guarda — ni condiciones con
 * operadores ni esperas: un flujo viaja como contexto, no como automatización.
 */
@Component({
  selector: 'studio-flow-panel',
  imports: [FormsModule, AppSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-0 flex-col gap-5 overflow-y-auto">
      <!-- La descripción es del FLUJO: se edita donde se edita el flujo. Antes se pintaba
           suelta sobre el lienzo, que solo sabía leerla (la escribía la IA y nadie más). -->
      @if (flow(); as current) {
        <section class="studio-box">
          <h2 class="studio-eyebrow mb-1">Flujo</h2>
          <p class="studio-ui mb-3 font-semibold" data-testid="flow-name">{{ current.name }}</p>

          <label for="flow-description" class="text-muted-foreground block text-xs font-semibold">De qué va</label>
          <textarea
            id="flow-description"
            class="border-input mt-1 w-full rounded border px-2 py-1 text-xs"
            rows="3"
            [attr.maxlength]="LIMIT"
            placeholder="Una frase de negocio: cuándo arranca el proceso y qué se espera de él"
            [value]="current.description ?? ''"
            (input)="describe($event)"
            data-testid="flow-description"
          ></textarea>
          <p class="text-muted-foreground mt-1 text-[10px]">
            {{ (current.description ?? '').length }}/{{ LIMIT }} · viaja con el diseño y aterriza en el CLAUDE.md de la
            app
          </p>
        </section>
      }

      <section class="studio-box">
        <h2 class="studio-eyebrow mb-3">Nodo seleccionado</h2>

        @if (node(); as current) {
          <div class="studio-row">
            <label for="flow-node-text">Texto</label>
            <input id="flow-node-text" [value]="current.text" (input)="rename($event)" data-testid="flow-node-text" />
          </div>

          <div class="studio-row">
            <label for="flow-node-entity">Entidad</label>
            <app-select
              controlId="flow-node-entity"
              [options]="entityOptions()"
              [ngModel]="current.entity ?? NONE"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="repoint($event)"
              data-testid="flow-node-entity"
            />
          </div>

          @if (machine(); as m) {
            <!-- convergencia (spec 44): el paso que ejecuta un verbo gana cuerpo real y endpoint -->
            <div class="studio-row">
              <label for="flow-node-transition">Transición</label>
              <app-select
                controlId="flow-node-transition"
                [options]="transitionOptions()"
                [ngModel]="current.transition ?? NONE"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="retransition($event)"
                data-testid="flow-node-transition"
              />
            </div>
          }

          <div class="studio-row">
            <label>Tipo</label>
            <span class="studio-ui text-muted-foreground" data-testid="flow-node-kind">{{
              kindLabel(current.kind)
            }}</span>
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
            <p class="text-muted-foreground mt-2 text-xs">El inicio no se borra: es por donde el proceso arranca.</p>
          }
        } @else {
          <p class="text-muted-foreground text-xs" data-testid="flow-node-empty">
            Elige un nodo en el diagrama y aquí aparecerán su texto y su entidad.
          </p>
        }
      </section>

      <section class="studio-box">
        <h2 class="studio-eyebrow mb-2">Vista de texto</h2>
        <p class="studio-ui text-muted-foreground" data-testid="flow-prose">{{ prose() }}</p>
        <p class="text-muted-foreground mt-2 text-xs">
          Así se lee lo dibujado. El proceso viaja con el diseño y aterriza como contexto en la app generada; no genera
          código.
        </p>
      </section>
    </div>
  `
})
export class FlowPanelComponent {
  protected readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly flow = computed(() => this.store.flows().find(flow => flow.name === this.active.flow()) ?? null)

  protected readonly node = computed(() => {
    const id = this.active.flowNode()
    return id ? (this.flow()?.nodes.find(node => node.id === id) ?? null) : null
  })

  /** La máquina de la entidad aludida por el paso elegido; sin ella no hay verbos que ofrecer. */
  protected readonly machine = computed(() => {
    const node = this.node()
    if (!node || node.kind !== 'step' || !node.entity) return null
    return this.store.resources().find(resource => resource.name === node.entity)?.state ?? null
  })

  protected readonly LIMIT = FLOW_LIMITS.description

  /** «Sin entidad» es una elección, no la ausencia de una: tiene su propia opción en la lista. */
  protected readonly NONE = NONE

  protected readonly entityOptions = computed<AppSelectOption[]>(() => [
    { value: NONE, label: '— ninguna —' },
    ...this.store.resources().map(resource => ({ value: resource.name, label: resource.labelSingular }))
  ])

  protected readonly transitionOptions = computed<AppSelectOption[]>(() => [
    { value: NONE, label: '— ninguna —' },
    ...(this.machine()?.transitions ?? []).map(transition => ({ value: transition.name, label: transition.label }))
  ])

  protected readonly prose = computed(() => {
    const flow = this.flow()
    return flow ? flowToProse(flow) : 'Todavía no hay ningún flujo dibujado.'
  })

  protected kindLabel(kind: FlowNodeKind): string {
    return FLOW_KIND_LABELS[kind]
  }

  protected describe(event: Event): void {
    const flow = this.flow()
    if (flow) this.store.describeFlow(flow.name, (event.target as HTMLTextAreaElement).value)
  }

  protected rename(event: Event): void {
    const flow = this.flow()
    const node = this.node()
    if (flow && node) this.store.updateFlowNode(flow.name, node.id, { text: (event.target as HTMLInputElement).value })
  }

  protected repoint(entity: string): void {
    const flow = this.flow()
    const node = this.node()
    // cambiar de entidad tira la transición: apuntaría a la máquina de OTRA entidad
    if (flow && node) this.store.updateFlowNode(flow.name, node.id, { entity: chosen(entity), transition: undefined })
  }

  protected retransition(transition: string): void {
    const flow = this.flow()
    const node = this.node()
    if (flow && node) this.store.updateFlowNode(flow.name, node.id, { transition: chosen(transition) })
  }

  protected remove(): void {
    const flow = this.flow()
    const node = this.node()
    if (!flow || !node) return
    if (this.store.removeFlowNode(flow.name, node.id)) this.active.selectFlowNode(null)
  }
}
