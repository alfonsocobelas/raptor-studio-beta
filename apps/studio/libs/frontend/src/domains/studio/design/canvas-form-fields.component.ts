import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import type { DraftField, DraftResource } from '@app/shared/domain'
import { formControlFor } from './form-preview'

/**
 * La parrilla de controles del formulario mock: un control por campo del draft,
 * con el mismo vocabulario que emite el generador (text/textarea/number/date/
 * checkbox/select). La comparten el diálogo del listado (parte A) y el bloque
 * Formulario del lienzo (spec 48). Es preview: los controles no capturan nada.
 */
@Component({
  selector: 'studio-canvas-form-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-4 sm:grid-cols-2">
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
export class CanvasFormFieldsComponent {
  readonly resource = input.required<DraftResource>()
  /** La fila del mock cuando el formulario enseña un registro existente. */
  readonly row = input<Record<string, unknown> | null>(null)

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
}
