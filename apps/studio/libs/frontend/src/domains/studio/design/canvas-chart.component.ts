import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import type { DesignBlock } from '@app/shared/domain'
import { DesignStore } from './design-store'
import { MEASURE_LABELS } from './kpi-config-options'
import { mockTotal } from './mock-data'

/**
 * Bloques BARRAS y EVOLUCIÓN (spec 72). Un solo componente para los dos: el mismo dato con dos
 * formas —barras horizontales por valor del enum, columnas por mes— y el mismo panel detrás.
 *
 * Mockup determinista: los valores salen de `mockTotal`, no de datos, pero el markup es el que
 * emite la app para que lo que se ve aquí sea lo que se va a generar.
 */
@Component({
  selector: 'studio-canvas-chart',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div class="app-panel bg-card rounded-lg border p-4" [attr.data-testid]="'canvas-' + v.kind">
        <h3 class="mb-3 text-sm font-semibold">{{ v.title }}</h3>

        @if (!v.axis) {
          <p class="text-muted-foreground text-xs">{{ v.missing }}</p>
        } @else if (v.kind === 'count-by') {
          <div class="space-y-2">
            @for (bar of v.bars; track bar.label) {
              <div class="flex items-center gap-2 text-sm">
                <span class="text-muted-foreground w-28 shrink-0 truncate">{{ bar.label }}</span>
                <div class="bg-muted h-3 flex-1 overflow-hidden rounded-sm">
                  <div class="bg-primary h-full rounded-sm" [style.width.%]="bar.width"></div>
                </div>
                <span class="w-10 text-right tabular-nums">{{ bar.value }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="flex h-24 items-end gap-1">
            @for (point of v.points; track point.label) {
              <div class="flex flex-1 flex-col items-center gap-1">
                <div class="bg-muted flex h-16 w-full items-end rounded-sm">
                  <div class="bg-primary w-full rounded-sm" [style.height.%]="point.height"></div>
                </div>
                <span class="text-muted-foreground text-[9px]">{{ point.label }}</span>
              </div>
            }
          </div>
        }

        <p class="text-muted-foreground mt-3 border-t pt-1.5 text-[9px] uppercase tracking-widest">
          {{ v.footer }}
        </p>
      </div>
    }
  `
})
export class CanvasChartComponent {
  readonly block = input.required<DesignBlock>()

  private readonly _store = inject(DesignStore)

  protected readonly view = computed(() => {
    const block = this.block()
    const draft = this._store.resources().find(r => r.name === block.resource)
    if (!draft) return null

    const kind = block.kind
    const axis = draft.fields.find(f => f.name === block.axisField)
    const measure = block.measure ?? 'count'
    const measured = draft.fields.find(f => f.name === block.measureField)
    const what = measure === 'count' ? draft.labelPlural.toLowerCase() : `${MEASURE_LABELS[measure].toLowerCase()} de ${measured?.label ?? '—'}`

    const values = axis?.values ?? []
    const bars = values.map((value, index) => ({
      label: value.label,
      value: mockTotal(index),
      width: (mockTotal(index) / Math.max(...values.map((_, i) => mockTotal(i)), 1)) * 100
    }))
    const points = MONTHS.map((label, index) => ({
      label,
      height: ((index % 5) + 2) * 14
    }))

    return {
      kind,
      axis,
      title: block.kpiLabel?.trim() || (kind === 'count-by' ? `${draft.labelPlural} por ${axis?.label ?? '—'}` : `${draft.labelPlural} por mes`),
      bars,
      points,
      missing:
        kind === 'count-by'
          ? 'Elige un campo con valores cerrados (un enum) para desglosar'
          : 'Elige el campo fecha sobre el que hacer los meses',
      footer: `${what} · ${kind === 'count-by' ? `por ${axis?.label ?? '—'}` : 'últimos 12 meses'}`
    }
  })
}

const MONTHS = ['sep', 'oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago']
