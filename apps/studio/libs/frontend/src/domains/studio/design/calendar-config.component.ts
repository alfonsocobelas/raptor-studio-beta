import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'

/**
 * Panel del bloque CALENDARIO (mock 22E): Fecha, Etiqueta, Color de la tira y
 * Fin de semana. Es el primer bloque con configuración propia: la config vive
 * en el bloque y el store la replica a la entidad ([[design-store]]).
 */
@Component({
  selector: 'studio-calendar-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect],
  template: `
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="calendar-config">
        <h3 class="mb-2 text-sm font-semibold">Componente · calendario</h3>
        <div class="space-y-2 text-xs">
          <label class="flex items-center justify-between gap-2">
            <span>Fecha</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.dateOptions"
              [ngModel]="v.block.dateField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ dateField: $event })"
              data-testid="calendar-date"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Etiqueta</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.labelOptions"
              [ngModel]="v.block.labelField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ labelField: $event || undefined })"
              data-testid="calendar-label"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Color de la tira</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.colorOptions"
              [ngModel]="v.block.colorField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ colorField: $event || undefined })"
              data-testid="calendar-color"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Fin de semana</span>
            <input
              type="checkbox"
              [checked]="v.block.weekends !== false"
              (change)="patch({ weekends: v.block.weekends === false })"
              data-testid="calendar-weekends"
            />
          </label>
          @if (v.legend.length) {
            <div class="space-y-1 pt-1">
              <p class="text-muted-foreground text-[10px] uppercase tracking-widest">Color de la tira</p>
              @for (entry of v.legend; track entry) {
                <p class="rounded-md border px-2 py-1">{{ entry }}</p>
              }
            </div>
          }
        </div>
      </section>
    }
  `
})
export class CalendarConfigComponent {
  readonly resource = input<string | null>(null)

  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly view = computed(() => {
    const pageIndex = this.active.index()
    const blocks = this.store.pages()[pageIndex]?.blocks ?? []
    const blockIndex = blocks.findIndex(b => b.kind === 'calendar' && b.resource === this.resource())
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (blockIndex < 0 || !draft) return null

    const block = blocks[blockIndex]
    const option = (name: string, label: string): AppSelectOption => ({ value: name, label })
    const colorField = draft.fields.find(f => f.name === block.colorField)

    return {
      pageIndex,
      blockIndex,
      block,
      dateOptions: draft.fields.filter(f => f.type === 'date').map(f => option(f.name, f.label)),
      labelOptions: draft.fields.filter(f => f.type !== 'date').map(f => option(f.name, f.label)),
      colorOptions: [
        option('', '— sin color'),
        ...draft.fields.filter(f => f.type === 'enum').map(f => option(f.name, f.label))
      ],
      legend: (colorField?.values ?? []).map(value => value.label)
    }
  })

  protected patch(change: {
    dateField?: string
    labelField?: string
    colorField?: string
    weekends?: boolean
  }): void {
    const v = this.view()
    if (v) this.store.setCalendarConfig(v.pageIndex, v.blockIndex, change)
  }
}
