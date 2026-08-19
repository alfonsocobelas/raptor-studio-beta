import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SELECTABLE_FIELD_TYPES, modelEdges, type DraftFieldType } from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { InspectorComponent } from './inspector.component'
import { TYPE_LABELS } from './field-type-labels'

/** Valor de la opción «— ninguna —»: la cadena vacía la lee el desplegable como «nada elegido». */
const NONE = '__ninguna__'

type ModelTab = 'field' | 'entity' | 'relation'

const MODEL_TABS: readonly { id: ModelTab; label: string }[] = [
  { id: 'field', label: 'Campo' },
  { id: 'entity', label: 'Entidad' },
  { id: 'relation', label: 'Relación' }
]

/**
 * Panel derecho del modo Modelo: la columna elegida, la entidad completa y sus
 * relaciones. Solo ofrece lo que el diseño sabe guardar —nombre y tipo—; ni
 * «obligatorio» ni «único» existen en DraftField, así que no se pintan.
 */
@Component({
  selector: 'studio-model-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect, InspectorComponent],
  template: `
    <div class="flex min-h-0 flex-col">
      <div class="flex items-center gap-4 border-b" role="tablist">
        @for (option of tabs; track option.id) {
          <button
            type="button"
            role="tab"
            class="studio-ui hover:border-b-foreground/30 hover:text-foreground -mb-px border-b-2 border-transparent px-2.5 pb-2.5 pt-3 font-semibold transition-colors"
            [class.border-b-foreground]="tab() === option.id"
            [class.font-semibold]="tab() === option.id"
            [class.text-muted-foreground]="tab() !== option.id"
            [attr.aria-selected]="tab() === option.id"
            [attr.data-testid]="'model-tab-' + option.id"
            (click)="tab.set(option.id)"
          >
            {{ option.label }}
          </button>
        }
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-0.5 pt-3">
        @switch (tab()) {
          @case ('field') {
            @if (field(); as current) {
              <p class="mb-3 text-sm font-semibold">{{ current.name }}</p>

              <div class="studio-row">
                <label for="field-name">Nombre</label>
                <input id="field-name" [value]="current.label" (input)="rename($event)" data-testid="field-name" />
              </div>

              <div class="studio-row">
                <label for="field-type">Tipo</label>
              <!-- una referencia no elige tipo: la columna que se emite es un uuid con su lookup -->
                <app-select
                  controlId="field-type"
                  [options]="typeOptions(current.type)"
                  [disabled]="current.type === 'ref'"
                  [ngModel]="current.type"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="retype($event)"
                  data-testid="field-type"
                />
              </div>

              <div class="studio-row">
                <label for="field-ref">Referencia</label>
                <app-select
                  controlId="field-ref"
                  [options]="refOptions()"
                  [ngModel]="current.refTo ?? NONE"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="repoint($event)"
                  data-testid="field-ref"
                />
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  class="hover:border-foreground/40 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                  data-testid="field-duplicate"
                  (click)="duplicate()"
                >
                  Duplicar
                </button>
                <button
                  type="button"
                  class="hover:border-foreground/40 rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-40"
                  [disabled]="current.index === 0"
                  title="Subir la columna"
                  data-testid="field-up"
                  (click)="move(-1)"
                >
                  ↑
                </button>
                <button
                  type="button"
                  class="hover:border-foreground/40 rounded-md border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-40"
                  [disabled]="current.index === current.total - 1"
                  title="Bajar la columna"
                  data-testid="field-down"
                  (click)="move(1)"
                >
                  ↓
                </button>
                <button
                  type="button"
                  class="text-destructive hover:border-destructive/50 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                  data-testid="field-delete"
                  (click)="remove()"
                >
                  Borrar
                </button>
              </div>

              @if (current.type === 'enum') {
                <!-- promover el enum a estado (spec 43): el ciclo de vida se dibuja sobre sus valores -->
                <label class="mt-4 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    class="mt-0.5"
                    [checked]="isStateAnchor()"
                    (click)="toggleState($event)"
                    data-testid="field-state-toggle"
                  />
                  <span>
                    Es el estado de la entidad
                    <span class="text-muted-foreground block text-xs">
                      Sus valores pasan a ser el ciclo de vida: se dibujan transiciones, el campo sale del
                      formulario y cada registro nace en el valor inicial.
                    </span>
                  </span>
                </label>
              }

              @if (current.type === 'ref') {
                <p class="text-muted-foreground mt-3 text-xs">
                  Con una referencia elegida, el campo se dibuja como flecha en el diagrama.
                </p>
              }
            } @else {
              <p class="text-muted-foreground text-xs" data-testid="field-empty">
                Elige una columna en el diagrama y aquí aparecerán su nombre y su tipo.
              </p>
            }
          }

          @case ('entity') {
            @if (active.resource(); as resource) {
              <studio-inspector [resource]="resource" (close)="active.selectResource(null)" />

              <!-- la frase es de la ENTIDAD: se escribe donde se edita la entidad, no en el
                   panel del bloque que la pinta (allí salía igual para tabla, ficha o KPIs) -->
              <label for="resource-brief" class="text-muted-foreground mt-4 block text-xs font-semibold">
                Para qué existe
              </label>
              <textarea
                id="resource-brief"
                class="border-input mt-1 w-full rounded border px-2 py-1 text-xs"
                rows="2"
                placeholder="Una frase de negocio (viaja con el diseño y aterriza en el CLAUDE.md de la app)"
                [ngModel]="brief()"
                [ngModelOptions]="{ standalone: true }"
                (change)="saveBrief(resource, $event)"
                data-testid="resource-brief"
              ></textarea>
            } @else {
              <p class="text-muted-foreground text-xs" data-testid="entity-empty">
                Elige una entidad en el diagrama para ver todas sus columnas.
              </p>
            }
          }

          @case ('relation') {
            @if (relations().length) {
              @for (relation of relations(); track relation.fieldIndex) {
                <div
                  class="mb-1.5 flex items-center justify-between rounded-md border px-2 py-2 text-sm"
                  [attr.data-testid]="'relation-' + $index"
                >
                  <span class="min-w-0 truncate">
                    {{ relation.from }} → <strong>{{ relation.to }}</strong>
                    <span class="text-muted-foreground ml-1 text-xs">N : 1</span>
                  </span>
                  <button
                    type="button"
                    class="text-destructive shrink-0 text-xs hover:underline"
                    [attr.data-testid]="'relation-delete-' + $index"
                    (click)="removeRelation(relation.from, relation.fieldIndex)"
                  >
                    quitar
                  </button>
                </div>
              }
            } @else {
              <p class="text-muted-foreground text-xs" data-testid="relation-empty">
                Esta entidad no tiene relaciones. Arrastra del asa de una caja a otra para crear una.
              </p>
            }
          }
        }
      </div>
    </div>
  `
})
export class ModelPanelComponent {
  private readonly store = inject(DesignStore)
  protected readonly active = inject(ActiveViewService)

  protected readonly tabs = MODEL_TABS
  protected readonly NONE = NONE

  /**
   * Una referencia no elige tipo: la columna que se emite es un uuid con su lookup, así que
   * el desplegable queda bloqueado enseñando eso mismo y sin más opciones que ofrecer.
   */
  protected typeOptions(current: DraftFieldType): AppSelectOption[] {
    return current === 'ref'
      ? [{ value: 'ref', label: 'referencia (uuid)' }]
      : SELECTABLE_FIELD_TYPES.map(type => ({ value: type, label: TYPE_LABELS[type] }))
  }

  protected readonly brief = computed(
    () => this.store.resources().find(r => r.name === this.active.resource())?.brief ?? ''
  )

  protected saveBrief(name: string, event: Event): void {
    this.store.setResourceBrief(name, (event.target as HTMLTextAreaElement).value)
  }

  protected readonly refOptions = computed<AppSelectOption[]>(() => [
    { value: NONE, label: '— ninguna —' },
    ...this.targets().map(target => ({ value: target.name, label: target.labelSingular }))
  ])

  /**
   * Elegir una columna en el diagrama trae el panel a su pestaña (igual que el de
   * vistas). Y saltar a OTRA entidad lleva a Entidad: la columna elegida era de la
   * anterior, así que quedarse en Campo enseñaría un panel vacío por respuesta.
   */
  protected readonly tab = linkedSignal<{ resource: string | null; field: number | null }, ModelTab>({
    source: () => ({ resource: this.active.resource(), field: this.active.field() }),
    computation: (current, previous) => {
      if (current.field !== null) return 'field'
      if (!previous) return 'field'
      if (current.resource && current.resource !== previous.source.resource) return 'entity'
      return previous.value
    }
  })

  /** La columna elegida, con su sitio: los botones de mover necesitan saber los bordes. */
  protected readonly field = computed(() => {
    const resource = this.store.resources().find(r => r.name === this.active.resource())
    const index = this.active.field()
    const current = index === null ? undefined : resource?.fields[index]
    return current && index !== null
      ? { ...current, index, total: resource?.fields.length ?? 0, resource: resource?.name ?? '' }
      : null
  })

  /** Las flechas que salen de la entidad elegida; si no hay ninguna elegida, todas. */
  protected readonly relations = computed(() => {
    const chosen = this.active.resource()
    const edges = modelEdges(this.store.resources())
    return chosen ? edges.filter(edge => edge.from === chosen) : edges
  })

  /** Destinos posibles: todas las entidades menos la propia. */
  protected readonly targets = computed(() =>
    this.store.resources().filter(resource => resource.name !== this.active.resource())
  )

  /** ¿La columna elegida es el ancla de la máquina de su entidad? */
  protected readonly isStateAnchor = computed(() => {
    const current = this.field()
    if (!current) return false
    return this.store.resources().find(r => r.name === current.resource)?.state?.field === current.name
  })

  /** Promover es reversible dibujando después; quitar tira transiciones y se confirma. */
  protected toggleState(event: Event): void {
    const current = this.field()
    if (!current) return
    if (!this.isStateAnchor()) {
      if (!this.store.promoteState(current.resource, current.name)) {
        ;(event.target as HTMLInputElement).checked = false
      }
      return
    }
    if (window.confirm('Quitar el estado tira las transiciones dibujadas. ¿Seguro?')) {
      this.store.demoteState(current.resource)
    } else {
      ;(event.target as HTMLInputElement).checked = true
    }
  }

  protected repoint(value: string): void {
    const current = this.field()
    if (current) this.store.setFieldRef(current.resource, current.index, value === NONE ? null : value)
  }

  protected rename(event: Event): void {
    const current = this.field()
    if (current)
      this.store.updateField(current.resource, current.index, { label: (event.target as HTMLInputElement).value })
  }

  protected retype(type: string): void {
    const current = this.field()
    if (current) this.store.updateField(current.resource, current.index, { type: type as DraftFieldType })
  }

  protected duplicate(): void {
    const current = this.field()
    if (current) this.store.duplicateField(current.resource, current.index)
  }

  protected move(delta: number): void {
    const current = this.field()
    if (!current) return
    if (this.store.moveField(current.resource, current.index, current.index + delta)) {
      this.active.selectField(current.resource, current.index + delta)
    }
  }

  protected remove(): void {
    const current = this.field()
    if (!current) return
    if (this.store.removeField(current.resource, current.index)) {
      this.active.selectField(current.resource, null)
    }
  }

  protected removeRelation(resource: string, fieldIndex: number): void {
    this.store.removeRelation(resource, fieldIndex)
  }
}
