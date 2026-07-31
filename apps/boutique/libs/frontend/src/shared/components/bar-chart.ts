import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'

export interface BarChartDatum {
  label: string
  value: number
}

/**
 * Gráfico de barras horizontales, una sola serie (magnitud por categoría).
 * Presentacional puro: recibe los datos ya agregados y ordenados. Barra fina con
 * extremo de dato redondeado y base recta, valor directo en la punta, sin leyenda
 * (la serie única la nombra el título de la card que lo contiene).
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2" role="img" [attr.aria-label]="ariaLabel()">
      @for (d of data(); track d.label) {
        <div class="group flex items-center gap-3" [title]="d.label + ': ' + d.value + ' ' + valueSuffix()">
          <span class="text-muted-foreground w-28 shrink-0 truncate text-right text-sm">{{ d.label }}</span>
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <div
              class="bg-primary group-hover:bg-primary/80 h-5 rounded-r"
              style="min-width: 2px"
              [style.width.%]="widthOf(d)"
            ></div>
            <span class="text-sm font-medium tabular-nums">{{ d.value }}</span>
          </div>
        </div>
      } @empty {
        <p class="text-muted-foreground py-6 text-center text-sm">Sin datos</p>
      }
    </div>
  `
})
export class BarChartComponent {
  readonly data = input.required<BarChartDatum[]>()
  readonly valueSuffix = input<string>('')
  readonly ariaLabel = input<string>('Gráfico de barras')

  private readonly _max = computed(() => Math.max(...this.data().map(d => d.value), 1))

  protected widthOf(d: BarChartDatum): number {
    return (d.value / this._max()) * 100
  }
}
