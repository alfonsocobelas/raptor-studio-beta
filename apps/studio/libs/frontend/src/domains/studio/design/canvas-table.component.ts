import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import {
  lucideDownload,
  lucideEye,
  lucideListFilter,
  lucidePencil,
  lucidePlus,
  lucideSearch,
  lucideSettings2,
  lucideTrash2,
  lucideX
} from '@ng-icons/lucide'
import { FormsModule } from '@angular/forms'
import { DRAFT_FIELD_TYPES, type DraftField, type DraftResource } from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { AppTooltip } from '../../../shared/components/ui/tooltip'
import { ActiveViewService } from './active-view.service'
import { CanvasFormDialogComponent } from './canvas-form-dialog.component'
import { DesignStore } from './design-store'
import { detailPageIndex } from './detail-page'
import { labelOfType } from './field-type-labels'
import { formDialogTitle, type FormDialogMode } from './form-preview'
import { buildSampleRows, mockTotal } from './mock-data'

// 5 filas: en el lienzo la tabla convive con otros bloques y no debe comérselos
const PAGE_SIZE = 5

/**
 * Techo de la columna de texto largo, EL MISMO que la app emitida (spec 54): el lienzo no
 * puede prometer una tabla más limpia que la que se genera. El número vive dos veces porque
 * el estudio no puede importar de `libs/generators` — ver `LONG_TEXT_MAX_WIDTH` en
 * `build-substitutions.ts`, igual que ya pasa con `BADGE_CLASSES` (spec 22).
 */
const LONG_TEXT_COL_MAX_PX = 280

/** Las cuatro variantes de badge del canon, en el mismo orden que el generador. */
/** «En curso» → «en_curso»: el valor va a la base, la etiqueta a la pantalla. */
function slug(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

const BADGE_CLASSES = [
  'bg-primary text-primary-foreground',
  'bg-secondary text-secondary-foreground',
  'border border-input',
  'bg-destructive text-white'
]

/**
 * Réplica CONTROLADA de la tabla emitida, pensada para diseñar: réplica fiel
 * del look del DataTable (búsqueda, botones, paginación) pero con cabeceras
 * editables — hover sobre una columna → /✕, popover para renombrar o cambiar
 * el tipo, y «+» para añadir columna. Toda edición muta el draft en el store.
 */
@Component({
  selector: 'studio-canvas-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppSelect, AppTooltip, CanvasFormDialogComponent, FormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideDownload,
      lucideEye,
      lucideListFilter,
      lucidePencil,
      lucidePlus,
      lucideSearch,
      lucideSettings2,
      lucideTrash2,
      lucideX
    })
  ],
  template: `
    @if (draft(); as resource) {
      <!-- chrome del listado (mock estático, mismo aspecto que el emitido) -->
      <div class="mb-3 flex items-center justify-between gap-3">
        <div
          class="border-input text-muted-foreground flex w-72 items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <ng-icon name="lucideSearch" size="14" />
          Buscar en todas las columnas...
        </div>
        <div class="flex gap-2">
          <!-- el crear va primero: mismo orden que el DataTable emitido -->
          <button
            type="button"
            class="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium"
            data-testid="table-create"
            (click)="openCreate($event)"
          >
            <ng-icon name="lucidePlus" size="14" />
            {{ createLabel() }}
          </button>
          <span class="chrome-btn"><ng-icon name="lucideListFilter" size="14" /> Filtros</span>
          <span class="chrome-btn"><ng-icon name="lucideSettings2" size="14" /> Columnas</span>
          <span class="chrome-btn"><ng-icon name="lucideDownload" size="14" /> Exportar</span>
        </div>
      </div>

      <div class="overflow-x-auto rounded-md border">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b">
              <th class="text-muted-foreground w-24 px-4 py-3 text-left font-medium">Acciones</th>
              @for (field of resource.fields; track $index) {
                <th
                  class="text-muted-foreground group/col relative cursor-pointer px-4 py-3 text-left font-medium"
                  [class.bg-accent]="editing() === $index"
                  [attr.data-testid]="'col-header-' + field.name"
                  (mouseenter)="hovered.set($index)"
                  (mouseleave)="hovered.set(null)"
                  (click)="toggleEditor($index)"
                >
                  <span class="flex items-center gap-1 whitespace-nowrap">
                    {{ field.label }}
                    <span class="ml-1 hidden gap-1 group-hover/col:inline-flex">
                      <span class="hover:text-foreground" title="Editar columna">
                        <ng-icon name="lucidePencil" size="13" />
                      </span>
                      <button
                        type="button"
                        class="text-destructive font-bold"
                        title="Borrar columna"
                        [attr.data-testid]="'col-delete-' + field.name"
                        (click)="removeColumn($event, $index)"
                      >
                        <ng-icon name="lucideX" size="13" />
                      </button>
                    </span>
                  </span>

                  @if (editing() === $index) {
                    <div
                      class="bg-background absolute left-0 top-full z-20 w-56 cursor-default rounded-md border p-3 text-left shadow-md"
                      data-testid="col-editor"
                      (click)="$event.stopPropagation()"
                    >
                      <label class="text-muted-foreground mb-1 block text-xs">Nombre de la columna</label>
                      <input
                        class="border-input mb-2 w-full rounded border px-2 py-1 text-sm"
                        [ngModel]="field.label"
                        (ngModelChange)="rename($index, $event)"
                        data-testid="col-editor-label"
                      />
                      <label class="text-muted-foreground mb-1 block text-xs">Tipo</label>
                      <app-select
                        class="block w-full"
                        [options]="typeOptions"
                        [ngModel]="field.type"
                        [ngModelOptions]="{ standalone: true }"
                        (ngModelChange)="retype($index, $event)"
                        data-testid="col-editor-type"
                      />

                      @if (field.type === 'enum') {
                        <label class="text-muted-foreground mb-1 mt-2 block text-xs">
                          Valores posibles (uno por línea)
                        </label>
                        <textarea
                          class="border-input w-full rounded border px-2 py-1 text-sm"
                          rows="4"
                          [ngModel]="valuesText(field)"
                          (ngModelChange)="revalue($index, $event)"
                          data-testid="col-editor-values"
                        ></textarea>
                        <p class="text-muted-foreground mt-1 text-xs">
                          Se pintan como etiquetas de color, en el orden que escribas.
                        </p>
                        @if (!field.values?.length) {
                          <p class="text-destructive mt-1 text-xs">Un conjunto sin valores no se genera.</p>
                        }
                      }
                      @if (field.type === 'ref') {
                        <label class="text-muted-foreground mb-1 mt-2 block text-xs">Entidad referenciada</label>
                        <app-select
                          class="block w-full"
                          placeholder="Elegir entidad…"
                          [options]="refOptions()"
                          [ngModel]="field.refTo ?? null"
                          [ngModelOptions]="{ standalone: true }"
                          (ngModelChange)="retarget($index, $event)"
                          data-testid="col-editor-refto"
                        />
                        @if (!field.refTo) {
                          <p class="text-destructive mt-1 text-xs">Una referencia sin destino no se genera.</p>
                        }
                      }
                      <div class="mt-2 flex justify-between">
                        <button type="button" class="text-destructive text-xs" (click)="removeColumn($event, $index)">
                          Borrar columna
                        </button>
                        <button type="button" class="text-muted-foreground text-xs" (click)="editing.set(null)">
                          cerrar
                        </button>
                      </div>
                    </div>
                  }
                </th>
              }
              <th class="w-12 px-2 py-3 text-left">
                <button
                  type="button"
                  class="border-input text-muted-foreground hover:bg-accent hover:text-foreground h-6 w-6 rounded border border-dashed text-sm"
                  title="Añadir columna"
                  data-testid="col-add"
                  (click)="addColumn($event)"
                >
                  <ng-icon name="lucidePlus" size="13" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index) {
              <tr class="hover:bg-muted/50 border-b last:border-0">
                <td class="text-muted-foreground flex gap-2 px-4 py-3">
                  <button
                    type="button"
                    class="hover:text-foreground disabled:cursor-default disabled:hover:text-inherit"
                    [disabled]="detailIndex() === null"
                    [attr.data-testid]="'row-open-' + $index"
                    [attr.title]="detailIndex() === null ? 'Esta entidad aún no tiene ficha' : 'Ir a la ficha'"
                    (click)="openDetail($event)"
                  >
                    <ng-icon name="lucideEye" size="15" />
                  </button>
                  <button
                    type="button"
                    class="hover:text-foreground"
                    title="Editar (abre el formulario)"
                    [attr.data-testid]="'row-edit-' + $index"
                    (click)="openEdit($event, row)"
                  >
                    <ng-icon name="lucidePencil" size="15" />
                  </button>
                  <ng-icon name="lucideTrash2" size="15" class="text-destructive" />
                </td>
                @for (field of resource.fields; track field.name) {
                  <td
                    class="px-4 py-3 whitespace-nowrap"
                    [attr.data-testid]="'cell-' + field.name"
                    [class.bg-accent]="hovered() === $index2(field)"
                    [class.text-right]="field.type === 'number' || field.type === 'integer'"
                  >
                    @if (field.type === 'enum') {
                      <span class="rounded-full px-2 py-0.5 text-xs" [class]="badgeClass(field, row)">
                        {{ row[field.name] }}
                      </span>
                    } @else if (field.type === 'text') {
                      <span
                        class="block truncate"
                        [style.max-width.px]="longTextMaxPx"
                        [appTooltip]="asText(row[field.name])"
                        [tooltipDisabled]="!asText(row[field.name])"
                      >
                        {{ row[field.name] }}
                      </span>
                    } @else {
                      {{ row[field.name] }}
                    }
                  </td>
                }
                <td></td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="text-muted-foreground mt-3 flex items-center justify-between text-sm">
        <span>1-{{ rows().length }} de {{ total() }} registros</span>
        <span class="flex items-center gap-2">
          Por página: <span class="chrome-btn">{{ pageSize }}</span>
          <span class="chrome-btn">‹</span>
          <span class="bg-primary text-primary-foreground rounded-md px-2.5 py-1">1</span>
          <span class="chrome-btn">2</span> … <span class="chrome-btn">{{ lastPage() }}</span>
          <span class="chrome-btn">›</span>
        </span>
      </div>

      @if (formMode(); as mode) {
        <studio-canvas-form-dialog
          [resource]="resource"
          [mode]="mode"
          [row]="formRow()"
          (closed)="formMode.set(null)"
        />
      }
    }
  `,
  styles: `
    /* El cromo del preset vive en el styles.css GLOBAL del estudio (mismo mecanismo que la
       app emitida): desde aquí la encapsulación lo dejaría ciego a los bloques hermanos. */
    .chrome-btn {
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      padding: 0.35rem 0.65rem;
      font-size: 0.8rem;
      color: var(--foreground);
      user-select: none;
    }
  `
})
export class CanvasTableComponent {
  readonly resource = input.required<string>()

  protected readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)
  protected readonly labelOfType = labelOfType
  protected readonly typeOptions: AppSelectOption[] = DRAFT_FIELD_TYPES.map(type => ({
    value: type,
    label: labelOfType(type)
  }))

  /** Candidatas a ser referenciadas: cualquier entidad menos la propia. */
  protected readonly otherResources = computed(() => this.store.resources().filter(r => r.name !== this.resource()))

  // Sin opción «ninguna»: una referencia sin destino no se genera, así que el hueco vacío es
  // un error que el editor señala, no una elección que ofrecer.
  protected readonly refOptions = computed<AppSelectOption[]>(() =>
    this.otherResources().map(other => ({ value: other.name, label: other.labelSingular }))
  )
  protected readonly pageSize = PAGE_SIZE
  protected readonly longTextMaxPx = LONG_TEXT_COL_MAX_PX

  /** El tooltip recibe texto: las filas de muestra guardan valores sin tipo. */
  protected asText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value)
  }

  /**
   * Mismo criterio que el generador (spec 22): la variante se asigna por
   * POSICIÓN del valor, así que el color del lienzo es el de la app emitida.
   */
  protected badgeClass(field: DraftField, row: Record<string, unknown>): string {
    const position = field.values?.findIndex(value => value.label === row[field.name]) ?? -1
    return BADGE_CLASSES[(position < 0 ? 0 : position) % BADGE_CLASSES.length]
  }
  protected readonly hovered = signal<number | null>(null)
  protected readonly editing = signal<number | null>(null)

  /** Diálogo de formulario mock: null = cerrado. En edición lleva la fila del lápiz. */
  protected readonly formMode = signal<FormDialogMode | null>(null)
  protected readonly formRow = signal<Record<string, unknown> | null>(null)

  /** Mismo rótulo que el botón emitido: la fórmula de género del generador. */
  protected readonly createLabel = computed(() => {
    const draft = this.draft()
    return draft ? formDialogTitle(draft, 'create') : ''
  })

  protected openCreate(event: Event): void {
    event.stopPropagation()
    this.formRow.set(null)
    this.formMode.set('create')
  }

  protected openEdit(event: Event, row: Record<string, unknown>): void {
    event.stopPropagation()
    this.formRow.set(row)
    this.formMode.set('edit')
  }

  /**
   * A dónde lleva el ojo: a la ficha de esta entidad, como en la app emitida, donde
   * la puerta de entrada al detalle es la acción de la fila y no la fila entera. Si el
   * diseño todavía no tiene esa ficha, el ojo se queda quieto en vez de mentir.
   */
  protected readonly detailIndex = computed(() => detailPageIndex(this.store.pages(), this.resource()))

  protected openDetail(event: Event): void {
    // el lienzo escucha el clic para elegir el bloque: aquí el gesto es irse, no seleccionar
    event.stopPropagation()
    const index = this.detailIndex()
    if (index !== null) this.active.select(index)
  }

  protected readonly draft = computed<DraftResource | null>(
    () => this.store.resources().find(r => r.name === this.resource()) ?? null
  )
  protected readonly rows = computed(() => {
    const draft = this.draft()
    return draft ? buildSampleRows(draft, PAGE_SIZE, this.store.resources()) : []
  })
  protected readonly total = computed(() =>
    mockTotal(this.store.resources().findIndex(r => r.name === this.resource()))
  )
  protected readonly lastPage = computed(() => Math.ceil(this.total() / PAGE_SIZE))

  // truco de plantilla: índice de columna para el resaltado (no hay $index de th aquí)
  protected $index2(field: { name: string }): number | null {
    const draft = this.draft()
    const index = draft?.fields.findIndex(f => f.name === field.name) ?? -1
    return index === -1 ? null : index
  }

  protected toggleEditor(index: number): void {
    this.editing.update(current => (current === index ? null : index))
  }

  protected rename(index: number, label: string): void {
    const draft = this.draft()
    if (!draft) return
    this.store.updateField(draft.name, index, { label, name: camel(label) || `campo${index + 1}` })
  }

  protected retype(index: number, type: string): void {
    const draft = this.draft()
    if (draft) this.store.updateField(draft.name, index, { type: type as (typeof DRAFT_FIELD_TYPES)[number] })
  }

  /** Las etiquetas, una por línea: es la forma más rápida de escribir un conjunto. */
  protected valuesText(field: DraftField): string {
    return (field.values ?? []).map(value => value.label).join('\n')
  }

  /**
   * El VALOR se deriva de la etiqueta (minúsculas, sin acentos, con guiones bajos)
   * porque es lo que viaja a la base; la etiqueta se queda como se escribió.
   */
  protected revalue(index: number, text: string): void {
    const draft = this.draft()
    if (!draft) return
    const values = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(label => ({ value: slug(label), label }))
    this.store.updateField(draft.name, index, { values })
  }

  protected retarget(index: number, refTo: string): void {
    const draft = this.draft()
    if (draft) this.store.updateField(draft.name, index, { refTo: refTo || undefined })
  }

  protected removeColumn(event: Event, index: number): void {
    event.stopPropagation()
    const draft = this.draft()
    if (draft) this.store.removeField(draft.name, index)
    this.editing.set(null)
  }

  protected addColumn(event: Event): void {
    event.stopPropagation()
    const draft = this.draft()
    if (!draft) return
    this.store.addField(draft.name)
    this.editing.set(draft.fields.length) // abre el editor de la nueva columna
  }
}

function camel(raw: string): string {
  const parts = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
  return parts.length
    ? parts[0] +
        parts
          .slice(1)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join('')
    : ''
}
