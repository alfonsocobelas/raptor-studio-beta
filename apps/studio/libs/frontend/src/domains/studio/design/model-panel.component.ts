import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { SELECTABLE_FIELD_TYPES, modelEdges, type DraftFieldType } from '@app/shared/domain'
import { AppConfirmDialog } from '../../../shared/components/ui/confirm-dialog'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { slug } from './enum-slug'
import { InspectorComponent } from './inspector.component'
import { LifecycleUiService } from './lifecycle-ui.service'
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
  imports: [FormsModule, AppConfirmDialog, AppSelect, InspectorComponent],
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
                <!-- los valores viven donde se edita el campo, no solo en el popover de Vistas;
                     la etiqueta manda y el value se deriva como slug (misma regla que Vistas) -->
                <div class="mt-4">
                  <p class="text-muted-foreground text-xs font-semibold">Valores posibles</p>
                  @for (value of current.values ?? []; track $index) {
                    <div class="mt-1.5 flex items-center gap-1">
                      <input
                        class="border-input min-w-0 flex-1 rounded border px-2 py-1 text-xs"
                        [value]="value.label"
                        (change)="revalue($index, $event)"
                        [attr.data-testid]="'enum-value-label-' + $index"
                      />
                      <button
                        type="button"
                        class="hover:border-foreground/40 rounded-md border px-1.5 py-1 text-xs transition-colors disabled:opacity-40"
                        [disabled]="$index === 0"
                        title="Subir el valor"
                        [attr.data-testid]="'enum-value-up-' + $index"
                        (click)="moveValue($index, -1)"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        class="hover:border-foreground/40 rounded-md border px-1.5 py-1 text-xs transition-colors disabled:opacity-40"
                        [disabled]="$index === (current.values?.length ?? 0) - 1"
                        title="Bajar el valor"
                        [attr.data-testid]="'enum-value-down-' + $index"
                        (click)="moveValue($index, 1)"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        class="text-destructive hover:border-destructive/50 rounded-md border px-1.5 py-1 text-xs transition-colors disabled:opacity-40"
                        [disabled]="(current.values?.length ?? 0) <= 1"
                        title="Borrar el valor"
                        [attr.data-testid]="'enum-value-delete-' + $index"
                        (click)="removeValue($index)"
                      >
                        ✕
                      </button>
                    </div>
                  }
                  <button
                    type="button"
                    class="hover:border-foreground/40 mt-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                    data-testid="enum-value-add"
                    (click)="addValue()"
                  >
                    + Añadir valor
                  </button>
                </div>

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
                      Sus valores pasan a ser el ciclo de vida: se dibujan transiciones, el campo sale del formulario y
                      cada registro nace en el valor inicial.
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

              <!-- el ciclo de vida es una propiedad de la entidad: su card vive aquí y
                   abre la sub-vista del lienzo, donde el diagrama tiene sitio para crecer -->
              @if (lifecycleSummary(); as machine) {
                <div class="mt-4 rounded-lg border p-3" data-testid="lifecycle-summary">
                  <p class="studio-eyebrow">Ciclo de vida · {{ machine.fieldLabel }}</p>
                  <p class="text-muted-foreground mt-0.5 text-xs">
                    {{ machine.states }} estados · {{ machine.transitions }} transiciones
                  </p>
                  <button
                    type="button"
                    class="studio-cta border-input mt-2 border"
                    data-testid="lifecycle-edit"
                    (click)="lifecycle.open.set(true)"
                  >
                    Editar
                  </button>
                </div>
              } @else if (enumAnchor(); as anchor) {
                <div class="mt-4 rounded-lg border p-3" data-testid="lifecycle-offer">
                  <p class="studio-eyebrow">Ciclo de vida</p>
                  <p class="text-muted-foreground mt-0.5 text-xs">
                    «{{ anchor.label }}» puede ser el estado de la entidad: sus valores pasan a ser el ciclo de vida y
                    cada registro nace en el inicial.
                  </p>
                  <button
                    type="button"
                    class="studio-cta border-input mt-2 border"
                    data-testid="lifecycle-define"
                    (click)="defineLifecycle()"
                  >
                    Definir ciclo de vida
                  </button>
                </div>
              }

              <!-- borrar arrastra sus bloques y las refs entrantes: se confirma, como quitar el estado -->
              <button
                type="button"
                class="text-destructive hover:border-destructive/50 mt-4 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                data-testid="entity-delete"
                (click)="removeResource(resource)"
              >
                Borrar entidad
              </button>
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

      <!-- las dos confirmaciones destructivas del panel comparten el diálogo de la app -->
      <app-confirm-dialog
        [open]="pending() !== null"
        [title]="confirmTitle()"
        [description]="confirmDescription()"
        [confirmLabel]="confirmLabel()"
        (confirmed)="confirmPending()"
        (closed)="pending.set(null)"
      />
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

  /** La sub-vista del ciclo de vida se abre desde aquí y la pinta el lienzo. */
  protected readonly lifecycle = inject(LifecycleUiService)

  /** El resumen de la máquina de la entidad elegida, si su ancla sigue siendo un enum con valores. */
  protected readonly lifecycleSummary = computed(() => {
    const resource = this.store.resources().find(r => r.name === this.active.resource())
    const machine = resource?.state
    const field = resource?.fields.find(f => f.name === machine?.field)
    if (!machine || !field?.values?.length) return null
    return { fieldLabel: field.label, states: field.values.length, transitions: machine.transitions.length }
  })

  /** Sin máquina: el enum candidato a ancla (el que se llama estado, o el primero). */
  protected readonly enumAnchor = computed(() => {
    const resource = this.store.resources().find(r => r.name === this.active.resource())
    if (!resource || resource.state) return null
    const enums = resource.fields.filter(f => f.type === 'enum' && f.values?.length)
    return enums.find(f => f.name.toLowerCase().includes('estado')) ?? enums[0] ?? null
  })

  /** El mismo gesto que el checkbox de la pestaña Campo, ofrecido a nivel de entidad. */
  protected defineLifecycle(): void {
    const resource = this.active.resource()
    const anchor = this.enumAnchor()
    if (!resource || !anchor) return
    if (this.store.promoteState(resource, anchor.name)) this.lifecycle.open.set(true)
  }

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
    // el checkbox no se destilda: si el diálogo confirma, lo destilda la señal
    event.preventDefault()
    this.pending.set({ kind: 'demote', resource: current.resource })
  }

  /** La confirmación destructiva pendiente: borrar la entidad o quitar su estado. */
  protected readonly pending = signal<
    { kind: 'entity'; name: string; label: string } | { kind: 'demote'; resource: string } | null
  >(null)

  protected readonly confirmTitle = computed(() => {
    const current = this.pending()
    if (!current) return ''
    return current.kind === 'entity' ? `¿Borrar «${current.label}»?` : '¿Quitar el estado de la entidad?'
  })

  protected readonly confirmDescription = computed(() => {
    const current = this.pending()
    if (!current) return ''
    return current.kind === 'entity'
      ? 'Se van con ella sus bloques, las vistas que queden vacías y las relaciones que le llegan de otras entidades.'
      : 'Quitar el estado tira las transiciones dibujadas.'
  })

  protected readonly confirmLabel = computed(() =>
    this.pending()?.kind === 'entity' ? 'Borrar entidad' : 'Quitar el estado'
  )

  protected confirmPending(): void {
    const current = this.pending()
    if (!current) return
    if (current.kind === 'demote') {
      this.store.demoteState(current.resource)
      return
    }
    if (this.store.removeResource(current.name)) this.active.selectResource(null)
  }

  /** Renombrar deriva el value; un label vacío o que choca con otro slug se descarta y el input vuelve. */
  protected revalue(valueIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement
    const current = this.field()
    if (!current) return
    const values = current.values ?? []
    const label = input.value.trim()
    const value = slug(label)
    const collides = values.some((v, i) => i !== valueIndex && v.value === value)
    if (!value || collides) {
      input.value = values[valueIndex]?.label ?? ''
      return
    }
    const next = values.map((v, i) => (i === valueIndex ? { value, label } : v))
    this.store.updateField(current.resource, current.index, { values: next })
  }

  protected addValue(): void {
    const current = this.field()
    if (!current) return
    const values = current.values ?? []
    let n = values.length + 1
    let label = `Valor ${n}`
    while (values.some(v => v.value === slug(label))) label = `Valor ${++n}`
    this.store.updateField(current.resource, current.index, { values: [...values, { value: slug(label), label }] })
  }

  /** El último no se borra: un enum sin valores rompe el ciclo de vida y el badge. */
  protected removeValue(valueIndex: number): void {
    const current = this.field()
    if (!current) return
    const values = current.values ?? []
    if (values.length <= 1) return
    this.store.updateField(current.resource, current.index, { values: values.filter((_, i) => i !== valueIndex) })
  }

  /** El orden importa: es el de las columnas del kanban y el del diagrama de estados. */
  protected moveValue(valueIndex: number, delta: number): void {
    const current = this.field()
    if (!current) return
    const values = [...(current.values ?? [])]
    const target = valueIndex + delta
    if (target < 0 || target >= values.length) return
    ;[values[valueIndex], values[target]] = [values[target], values[valueIndex]]
    this.store.updateField(current.resource, current.index, { values })
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

  /** Borrar la entidad arrastra sus bloques y las relaciones entrantes: se confirma en el diálogo. */
  protected removeResource(name: string): void {
    const label = this.store.resources().find(r => r.name === name)?.labelSingular ?? name
    this.pending.set({ kind: 'entity', name, label })
  }
}
