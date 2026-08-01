import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DRAFT_FIELD_TYPES, type DraftResource } from '@app/shared/domain'
import { DesignStore } from './design-store'
import { buildSampleRows, mockTotal } from './mock-data'

const PAGE_SIZE = 10

/**
 * Réplica CONTROLADA de la tabla emitida, pensada para diseñar: réplica fiel
 * del look del DataTable (búsqueda, botones, paginación) pero con cabeceras
 * editables — hover sobre una columna → ✎/✕, popover para renombrar o cambiar
 * el tipo, y «+» para añadir columna. Toda edición muta el draft en el store.
 */
@Component({
  selector: 'studio-canvas-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (draft(); as resource) {
      <!-- chrome del listado (mock estático, mismo aspecto que el emitido) -->
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="border-input text-muted-foreground flex w-72 items-center gap-2 rounded-md border px-3 py-2 text-sm">
          <span>🔍</span> Buscar en todas las columnas...
        </div>
        <div class="flex gap-2">
          <span class="chrome-btn">▽ Filtros</span>
          <span class="chrome-btn">▥ Columnas</span>
          <span class="chrome-btn">⬇ Exportar</span>
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
                  <span class="flex items-center gap-1">
                    {{ field.label }}
                    <span class="ml-1 hidden gap-1 group-hover/col:inline-flex">
                      <span class="hover:text-foreground" title="Editar columna">✎</span>
                      <button
                        type="button"
                        class="text-destructive font-bold"
                        title="Borrar columna"
                        [attr.data-testid]="'col-delete-' + field.name"
                        (click)="removeColumn($event, $index)"
                      >
                        ✕
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
                      <select
                        class="border-input w-full rounded border px-2 py-1 text-sm"
                        [ngModel]="field.type"
                        (ngModelChange)="retype($index, $event)"
                        data-testid="col-editor-type"
                      >
                        @for (type of types; track type) {
                          <option [value]="type">{{ type }}</option>
                        }
                      </select>
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
                  +
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index) {
              <tr class="hover:bg-muted/50 border-b last:border-0">
                <td class="text-muted-foreground px-4 py-3">✎ &nbsp; 🗑</td>
                @for (field of resource.fields; track field.name) {
                  <td
                    class="px-4 py-3"
                    [class.bg-accent]="hovered() === $index2(field)"
                    [class.text-right]="field.type === 'number' || field.type === 'integer'"
                  >
                    {{ row[field.name] }}
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
          Por página: <span class="chrome-btn">10 ▾</span>
          <span class="chrome-btn">‹</span>
          <span class="bg-primary text-primary-foreground rounded-md px-2.5 py-1">1</span>
          <span class="chrome-btn">2</span> … <span class="chrome-btn">{{ lastPage() }}</span>
          <span class="chrome-btn">›</span>
        </span>
      </div>
    }
  `,
  styles: `
    .chrome-btn {
      border: 1px solid hsl(var(--border));
      border-radius: 0.375rem;
      padding: 0.35rem 0.65rem;
      font-size: 0.8rem;
      color: hsl(var(--foreground));
      user-select: none;
    }
  `
})
export class CanvasTableComponent {
  readonly resource = input.required<string>()

  protected readonly store = inject(DesignStore)
  protected readonly types = DRAFT_FIELD_TYPES
  protected readonly hovered = signal<number | null>(null)
  protected readonly editing = signal<number | null>(null)

  protected readonly draft = computed<DraftResource | null>(
    () => this.store.resources().find(r => r.name === this.resource()) ?? null
  )
  protected readonly rows = computed(() => {
    const draft = this.draft()
    return draft ? buildSampleRows(draft, PAGE_SIZE) : []
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
  return parts.length ? parts[0] + parts.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('') : ''
}
