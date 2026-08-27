import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { DraftField, DraftResource } from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
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
  imports: [FormsModule, AppSelect],
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
              <label class="app-label text-sm font-medium">{{ field.label }}</label>
              <textarea class="form-control resize-none" rows="3" [value]="prefill(field)"></textarea>
            }
            @case ('checkbox') {
              <label class="app-label flex items-center gap-2 pt-6 text-sm font-medium">
                <input type="checkbox" [checked]="checkedValue(field)" />
                {{ field.label }}
              </label>
            }
            @case ('date') {
              <label class="app-label text-sm font-medium">{{ field.label }}</label>
              <input type="date" class="form-control" />
            }
            @case ('time') {
              <label class="app-label text-sm font-medium">{{ field.label }}</label>
              <input type="time" class="form-control" />
            }
            @case ('lookup') {
              <label class="app-label text-sm font-medium">{{ field.label }}</label>
              <input
                type="text"
                role="combobox"
                class="form-control"
                placeholder="Buscar…"
                [value]="prefill(field)"
                [attr.data-testid]="'form-lookup-' + field.name"
              />
            }
            @case ('number') {
              <label class="app-label text-sm font-medium">{{ field.label }}</label>
              <input type="number" class="form-control" [value]="prefill(field)" />
            }
            @case ('select') {
              <label class="app-label text-sm font-medium">{{ field.label }}</label>
              <app-select
                class="app-control"
                class="block w-full"
                [placeholder]="selectPlaceholder(field)"
                [options]="optionsFor(field)"
                [ngModel]="prefill(field) || null"
                [ngModelOptions]="{ standalone: true }"
                [attr.data-testid]="'form-select-' + field.name"
              />
            }
            @default {
              <label class="app-label text-sm font-medium">{{ field.label }}</label>
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

  /**
   * enum → sus etiquetas; ref → la fila del mock como única opción (es preview). Valor y
   * etiqueta coinciden: aquí nada se guarda, solo se enseña cómo se verá.
   *
   * Se indexan una vez por diseño: devolver un array NUEVO en cada ciclo de detección deja
   * al desplegable con un input siempre distinto y el ciclo no cierra nunca (el runner se
   * quedó colgado hasta que esto se memoizó).
   */
  private readonly optionsIndex = computed<Record<string, AppSelectOption[]>>(() => {
    const index: Record<string, AppSelectOption[]> = {}
    for (const field of this.resource().fields) {
      const labels = field.type === 'enum' ? (field.values ?? []).map(v => v.label) : withValue(this.prefill(field))
      index[field.name] = labels.map(label => ({ value: label, label }))
    }
    return index
  })

  protected optionsFor(field: DraftField): AppSelectOption[] {
    return this.optionsIndex()[field.name] ?? []
  }

  protected selectPlaceholder(field: DraftField): string {
    return field.type === 'ref' ? 'Elegir…' : 'Seleccionar…'
  }
}

function withValue(current: string): string[] {
  return current ? [current] : []
}
