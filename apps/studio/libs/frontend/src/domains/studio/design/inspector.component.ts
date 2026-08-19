import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DRAFT_FIELD_TYPES } from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { DesignStore } from './design-store'
import { labelOfType } from './field-type-labels'

/**
 * Inspector básico de la entidad seleccionada: columnas (nombre, etiqueta,
 * tipo), añadir y quitar. La edición avanzada llega por chat.
 */
@Component({
  selector: 'studio-inspector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect],
  template: `
    @if (draft(); as resource) {
      <section class="border-t pt-3" data-testid="inspector">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-sm font-semibold">{{ resource.labelSingular }} · columnas</h3>
          <button type="button" class="text-muted-foreground text-xs hover:underline" (click)="close.emit()">
            cerrar
          </button>
        </div>
        <div class="space-y-2">
          @for (field of resource.fields; track $index) {
            <div class="flex items-center gap-1">
              <!-- el nombre se lee como texto: la caja solo aparece cuando se va a escribir en él -->
              <input
                class="hover:border-input focus:border-input w-24 min-w-0 flex-1 rounded border border-transparent px-2 py-1 text-xs outline-none"
                [ngModel]="field.label"
                (ngModelChange)="rename($index, $event)"
                [attr.data-testid]="'field-label-' + $index"
              />
              <!-- ancho fijo: es una COLUMNA, y con el ancho del contenido cada fila empezaría
                   en un sitio (cabe «lista de valores», la etiqueta más larga del canon) -->
              <app-select
                class="w-[124px] shrink-0"
                size="sm"
                [options]="typeOptions"
                [ngModel]="field.type"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="retype($index, $event)"
                [attr.data-testid]="'field-type-' + $index"
              />
              <button
                type="button"
                class="text-destructive px-1 text-xs"
                [attr.data-testid]="'field-remove-' + $index"
                (click)="store.removeField(resource.name, $index)"
              >
                ✕
              </button>
            </div>
          }
        </div>
        <button
          type="button"
          class="border-input hover:bg-accent mt-2 w-full rounded-md border border-dashed px-2 py-1.5 text-xs"
          data-testid="field-add"
          (click)="store.addField(resource.name)"
        >
          + Añadir columna
        </button>
        @if (store.lastError(); as error) {
          <p class="text-destructive mt-2 text-xs">{{ error }}</p>
        }
      </section>
    }
  `
})
export class InspectorComponent {
  readonly resource = input<string | null>(null)
  readonly close = output<void>()

  protected readonly store = inject(DesignStore)
  // El desplegable enseña el nombre legible del canon, no el identificador del tipo.
  protected readonly typeOptions: AppSelectOption[] = DRAFT_FIELD_TYPES.map(type => ({
    value: type,
    label: labelOfType(type)
  }))

  protected readonly draft = computed(() => this.store.resources().find(r => r.name === this.resource()) ?? null)

  protected rename(index: number, label: string): void {
    const resource = this.draft()
    if (!resource) return
    this.store.updateField(resource.name, index, { label, name: camel(label) || `campo${index + 1}` })
  }

  protected retype(index: number, type: string): void {
    const resource = this.draft()
    if (!resource) return
    this.store.updateField(resource.name, index, { type: type as (typeof DRAFT_FIELD_TYPES)[number] })
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
