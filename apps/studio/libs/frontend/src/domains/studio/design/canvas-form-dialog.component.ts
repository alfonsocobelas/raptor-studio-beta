import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import type { DraftField, DraftResource } from '@app/shared/domain'
import { formControlFor, formDialogDescription, formDialogTitle, type FormDialogMode } from './form-preview'

/**
 * Réplica del diálogo de alta/edición que emite el generador (app-dialog-content +
 * un control por campo). Es preview: los controles se pintan con el aspecto y el
 * dato de la fila, pero Guardar solo cierra — aquí no se captura nada.
 */
@Component({
  selector: 'studio-canvas-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="form-dialog"
      (click)="onOverlay($event)"
    >
      <div
        class="bg-background max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border p-6 shadow-lg"
        (click)="$event.stopPropagation()"
      >
        <h2 class="text-lg font-semibold" data-testid="form-dialog-title">{{ title() }}</h2>
        <p class="text-muted-foreground mt-1 text-sm" data-testid="form-dialog-description">{{ description() }}</p>

        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          @for (field of resource().fields; track field.name) {
            <div
              class="flex flex-col gap-1.5"
              [class.sm:col-span-2]="controlFor(field) === 'textarea'"
              [attr.data-testid]="'form-field-' + field.name"
            >
              @switch (controlFor(field)) {
                @case ('textarea') {
                  <label class="text-sm font-medium">{{ field.label }}</label>
                  <textarea class="form-control resize-none" rows="3" [value]="prefill(field)"></textarea>
                }
                @case ('checkbox') {
                  <label class="flex items-center gap-2 pt-6 text-sm font-medium">
                    <input type="checkbox" [checked]="checkedValue(field)" />
                    {{ field.label }}
                  </label>
                }
                @case ('date') {
                  <label class="text-sm font-medium">{{ field.label }}</label>
                  <input type="date" class="form-control" />
                }
                @case ('number') {
                  <label class="text-sm font-medium">{{ field.label }}</label>
                  <input type="number" class="form-control" [value]="prefill(field)" />
                }
                @case ('select') {
                  <label class="text-sm font-medium">{{ field.label }}</label>
                  <select class="form-control">
                    <option value="">{{ selectPlaceholder(field) }}</option>
                    @for (option of selectOptions(field); track option) {
                      <option [selected]="option === prefill(field)">{{ option }}</option>
                    }
                  </select>
                }
                @default {
                  <label class="text-sm font-medium">{{ field.label }}</label>
                  <input type="text" class="form-control" [value]="prefill(field)" />
                }
              }
            </div>
          }
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="border-input hover:bg-accent rounded-md border px-4 py-2 text-sm font-medium"
            data-testid="form-dialog-cancel"
            (click)="closed.emit()"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium"
            data-testid="form-dialog-save"
            (click)="closed.emit()"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .form-control {
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      padding: 0.45rem 0.65rem;
      font-size: 0.875rem;
      background: var(--background);
      color: var(--foreground);
      width: 100%;
    }
  `
})
export class CanvasFormDialogComponent {
  readonly resource = input.required<DraftResource>()
  readonly mode = input.required<FormDialogMode>()
  /** La fila del mock cuando el diálogo viene del lápiz: en edición se enseña relleno. */
  readonly row = input<Record<string, unknown> | null>(null)
  readonly closed = output<void>()

  protected readonly title = computed(() => formDialogTitle(this.resource(), this.mode()))
  protected readonly description = computed(() => formDialogDescription(this.resource(), this.mode()))
  protected readonly controlFor = formControlFor

  protected prefill(field: DraftField): string {
    const value = this.row()?.[field.name]
    return value === undefined || value === null ? '' : String(value)
  }

  protected checkedValue(field: DraftField): boolean {
    const value = this.row()?.[field.name]
    return value === true || value === 'Sí'
  }

  /** enum → sus etiquetas; ref → la fila del mock como única opción (es preview). */
  protected selectOptions(field: DraftField): string[] {
    if (field.type === 'enum') return (field.values ?? []).map(v => v.label)
    const current = this.prefill(field)
    return current ? [current] : []
  }

  protected selectPlaceholder(field: DraftField): string {
    return field.type === 'ref' ? 'Elegir…' : 'Seleccionar…'
  }

  protected onOverlay(event: Event): void {
    // el lienzo escucha clics para seleccionar bloques: el overlay no debe llegarle
    event.stopPropagation()
    this.closed.emit()
  }
}
