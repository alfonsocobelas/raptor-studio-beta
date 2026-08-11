import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core'
import { SELECTABLE_FIELD_TYPES, modelEdges, type DraftFieldType } from '@app/shared/domain'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import { InspectorComponent } from './inspector.component'
import { TYPE_LABELS } from './field-type-labels'

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
  imports: [InspectorComponent],
  template: `
    <div class="flex min-h-0 flex-col">
      <div class="flex items-center gap-4 border-b" role="tablist">
        @for (option of tabs; track option.id) {
          <button
            type="button"
            role="tab"
            class="hover:border-b-foreground/30 hover:text-foreground -mb-px border-b-2 border-transparent px-0.5 pb-2 text-sm transition-colors"
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

              <label class="text-muted-foreground mb-1 block text-xs" for="field-name">Nombre</label>
              <input
                id="field-name"
                class="border-input mb-3 w-full rounded-md border px-2 py-1.5 text-sm"
                [value]="current.label"
                (input)="rename($event)"
                data-testid="field-name"
              />

              <label class="text-muted-foreground mb-1 block text-xs" for="field-type">Tipo</label>
              <!-- una referencia no elige tipo: la columna que se emite es un uuid con su lookup -->
              <select
                id="field-type"
                class="border-input mb-4 w-full rounded-md border px-2 py-1.5 text-sm disabled:opacity-60"
                [value]="current.type"
                [disabled]="current.type === 'ref'"
                (change)="retype($event)"
                data-testid="field-type"
              >
                @if (current.type === 'ref') {
                  <option value="ref">referencia (uuid)</option>
                } @else {
                  @for (type of types; track type) {
                    <option [value]="type">{{ label(type) }}</option>
                  }
                }
              </select>

              <label class="text-muted-foreground mb-1 block text-xs" for="field-ref">Referencia</label>
              <select
                id="field-ref"
                class="border-input mb-4 w-full rounded-md border px-2 py-1.5 text-sm"
                [value]="current.refTo ?? ''"
                (change)="repoint($event)"
                data-testid="field-ref"
              >
                <option value="">— ninguna —</option>
                @for (target of targets(); track target.name) {
                  <option [value]="target.name">{{ target.labelSingular }}</option>
                }
              </select>

              <div class="flex flex-wrap items-center gap-1.5">
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
  protected readonly types = SELECTABLE_FIELD_TYPES

  /** Elegir una columna en el diagrama trae el panel a su pestaña (igual que el de vistas). */
  protected readonly tab = linkedSignal<number | null, ModelTab>({
    source: () => this.active.field(),
    computation: (field, previous) => (field !== null ? 'field' : (previous?.value ?? 'field'))
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

  protected repoint(event: Event): void {
    const current = this.field()
    const value = (event.target as HTMLSelectElement).value
    if (current) this.store.setFieldRef(current.resource, current.index, value || null)
  }

  protected label(type: DraftFieldType): string {
    return TYPE_LABELS[type]
  }

  protected rename(event: Event): void {
    const current = this.field()
    if (current)
      this.store.updateField(current.resource, current.index, { label: (event.target as HTMLInputElement).value })
  }

  protected retype(event: Event): void {
    const current = this.field()
    const type = (event.target as HTMLSelectElement).value as DraftFieldType
    if (current) this.store.updateField(current.resource, current.index, { type })
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
