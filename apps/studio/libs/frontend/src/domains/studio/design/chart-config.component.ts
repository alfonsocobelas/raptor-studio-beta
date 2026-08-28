import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import type { KpiCell } from '@app/shared/domain'
import { AppSelect, type AppSelectOption } from '../../../shared/components/ui/select'
import { ActiveViewService } from './active-view.service'
import { DesignStore } from './design-store'
import {
  cellAt,
  dateFieldsOf,
  MEASURE_LABELS,
  measurableFieldsOf,
  measureAllowedOn,
  measuresFor,
  nextMeasureField
} from './kpi-config-options'

/**
 * Panel de los bloques BARRAS y EVOLUCIÓN (spec 72). Un panel para los dos: cambia el eje —un enum
 * en las barras, una fecha en la serie— y el resto es idéntico.
 *
 * Sin medida cuentan registros. Con medida enseñan una suma, una media, un máximo o un mínimo, que
 * es lo que iban a ser los kinds `sum-by` y `series-sum`.
 */
@Component({
  selector: 'studio-chart-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, AppSelect],
  template: `
    @if (view(); as v) {
      <section class="mb-4 border-t pt-3" data-testid="chart-config">
        <h3 class="mb-2 text-sm font-semibold">Componente · {{ v.title }}</h3>
        <div class="space-y-2 text-xs">
          <label class="flex items-center justify-between gap-2">
            <span>Etiqueta</span>
            <input
              class="app-input w-[124px] shrink-0 rounded-md border px-2 py-1 text-xs"
              [value]="v.block.kpiLabel ?? ''"
              (change)="onLabel($event)"
              [placeholder]="v.placeholder"
              data-testid="chart-label"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>{{ v.axisLabel }}</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.axisOptions"
              [ngModel]="v.block.axisField ?? ''"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="patch({ axisField: $event })"
              data-testid="chart-axis"
            />
          </label>
          <label class="flex items-center justify-between gap-2">
            <span>Qué enseña</span>
            <app-select
              class="w-[124px] shrink-0"
              size="sm"
              [options]="v.measures"
              [ngModel]="v.measure"
              [ngModelOptions]="{ standalone: true }"
              (ngModelChange)="onMeasure($event)"
              data-testid="chart-measure"
            />
          </label>
          @if (v.measure !== 'count') {
            <label class="flex items-center justify-between gap-2">
              <span>Campo</span>
              <app-select
                class="w-[124px] shrink-0"
                size="sm"
                [options]="v.measurableFields"
                [ngModel]="v.block.measureField ?? ''"
                [ngModelOptions]="{ standalone: true }"
                (ngModelChange)="patch({ measureField: $event })"
                data-testid="chart-measure-field"
              />
            </label>
          }
          @if (!v.axisOptions.length) {
            <p class="text-muted-foreground pt-1 text-[10px]">{{ v.missing }}</p>
          }
        </div>
      </section>
    }
  `
})
export class ChartConfigComponent {
  readonly resource = input<string | null>(null)

  private readonly store = inject(DesignStore)
  private readonly active = inject(ActiveViewService)

  protected readonly view = computed(() => {
    const pageIndex = this.active.index()
    const blocks = this.store.pages()[pageIndex]?.blocks ?? []
    const found = cellAt(blocks, ['count-by', 'series'], this.resource())
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!found || !draft) return null

    const { blockIndex, cellIndex, cell: block } = found
    const bars = block.kind === 'count-by'
    const option = (value: string, label: string): AppSelectOption => ({ value, label })
    const measure = block.measure ?? 'count'
    // el eje de las barras es un enum (valores cerrados); el de la serie, una fecha
    const axisFields = bars ? draft.fields.filter(f => f.type === 'enum') : dateFieldsOf(draft)

    return {
      pageIndex,
      blockIndex,
      cellIndex,
      block,
      measure,
      title: bars ? 'barras' : 'evolución',
      placeholder: bars ? `${draft.labelPlural} por …` : `${draft.labelPlural} por mes`,
      axisLabel: bars ? 'Desglosar por' : 'Sobre la fecha',
      axisOptions: axisFields.map(f => option(f.name, f.label)),
      missing: bars
        ? 'Esta entidad no tiene ningún campo con valores cerrados que desglosar.'
        : 'Esta entidad no tiene ningún campo fecha sobre el que hacer los meses.',
      measures: measuresFor(draft).map(m => option(m, MEASURE_LABELS[m])),
      measurableFields: measurableFieldsOf(draft)
        .filter(entry => measureAllowedOn(measure, entry.kind))
        .map(entry => option(entry.field.name, entry.field.label))
    }
  })

  protected onLabel(event: Event): void {
    this.patch({ kpiLabel: (event.target as HTMLInputElement).value })
  }

  /** Cambiar de medida invalida el campo si el nuevo tipo no lo admite (sumar una fecha). */
  protected onMeasure(measure: string): void {
    const v = this.view()
    const draft = this.store.resources().find(r => r.name === this.resource())
    if (!v || !draft) return

    this.patch({ measure, measureField: nextMeasureField(draft, measure, v.block.measureField) })
  }

  protected patch(change: Partial<KpiCell>): void {
    const v = this.view()
    if (v) this.store.setCellConfig(v.pageIndex, v.blockIndex, v.cellIndex, change)
  }
}
