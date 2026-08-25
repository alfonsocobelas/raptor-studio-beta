import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import type { DraftResource } from '@app/shared/domain'
import { CanvasFormFieldsComponent } from './canvas-form-fields.component'
import { formDialogDescription, formDialogTitle, type FormDialogMode } from './form-preview'

/**
 * Réplica del diálogo de alta/edición que emite el generador (app-dialog-content +
 * un control por campo). Es preview: los controles se pintan con el aspecto y el
 * dato de la fila, pero Guardar solo cierra — aquí no se captura nada.
 */
@Component({
  selector: 'studio-canvas-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CanvasFormFieldsComponent],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      data-testid="form-dialog"
      (click)="onOverlay($event)"
    >
      <div
        class="app-panel bg-background max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border p-6 shadow-lg"
        (click)="$event.stopPropagation()"
      >
        <h2 class="app-panel-head text-lg font-semibold" data-testid="form-dialog-title">{{ title() }}</h2>
        <p class="text-muted-foreground mt-1 text-sm" data-testid="form-dialog-description">{{ description() }}</p>

        <div class="mt-6">
          <studio-canvas-form-fields [resource]="resource()" [row]="row()" />
        </div>

        <div class="app-toolbar mt-6 flex justify-end gap-2">
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

  protected onOverlay(event: Event): void {
    // el lienzo escucha clics para seleccionar bloques: el overlay no debe llegarle
    event.stopPropagation()
    this.closed.emit()
  }
}
