import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { HlmCardImports } from '@spartan-ng/helm/card'

/**
 * Tarjeta KPI (título discreto + valor protagonista). Componente presentacional:
 * `value` llega ya formateado desde la pantalla (moneda, %, pipes).
 *
 * Los cuatro extras son OPCIONALES y los usa el bloque `kpi` del panel (spec 70): variación,
 * porcentaje y barra de progreso. Sin ellos la tarjeta es exactamente la de siempre, y así una
 * tarjeta de total y un KPI condicionado se ven hermanos —que es lo que el panel necesita—.
 */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmCardImports],
  // block h-full: el host llena la celda del grid y la card interior el host, para que las
  // cards de una misma fila queden alineadas en altura aunque su contenido difiera (spec 47).
  host: { class: 'block h-full' },
  template: `
    <section
      hlmCard
      class="app-panel h-full"
      [class.border-destructive/30]="destructive()"
      [attr.data-testid]="testId() ?? null"
    >
      <div class="pb-2" hlmCardHeader>
        <h3
          class="app-panel-head text-sm font-medium"
          [class.text-muted-foreground]="!destructive()"
          [class.text-destructive]="destructive()"
          hlmCardTitle
        >
          {{ title() }}
        </h3>
      </div>
      <div hlmCardContent>
        <p class="app-metric text-2xl font-bold" [class.text-destructive]="destructive()">
          {{ value() }}
          @if (percent() !== undefined) {
            <span class="text-muted-foreground text-sm font-normal">&nbsp;· {{ percent() }}%</span>
          }
          @if (target() !== undefined) {
            <span class="text-muted-foreground text-sm font-normal">&nbsp;de {{ target() }}</span>
          }
          @if (valueSuffix(); as suffix) {
            <span class="text-muted-foreground text-sm font-normal">{{ suffix }}</span>
          }
        </p>
        @if (delta(); as variation) {
          <p
            class="text-xs"
            [class.text-emerald-600]="variation.direction === 'up'"
            [class.text-destructive]="variation.direction === 'down'"
          >
            {{ variation.direction === 'up' ? '▲' : variation.direction === 'down' ? '▼' : '=' }}
            {{ variation.percent === undefined ? signed(variation.absolute) : variation.percent + '%' }}
          </p>
        }
        @if (progress() !== undefined) {
          <div class="bg-muted mt-2 h-2 overflow-hidden rounded-sm">
            <div class="bg-primary h-full rounded-sm" [style.width.%]="progress()"></div>
          </div>
        }
        @if (subtitle(); as sub) {
          <p class="text-muted-foreground text-xs">{{ sub }}</p>
        }
      </div>
    </section>
  `
})
export class KpiCardComponent {
  readonly title = input.required<string>()
  readonly value = input.required<string | number>()
  readonly subtitle = input<string>()
  readonly valueSuffix = input<string>()
  readonly variant = input<'default' | 'destructive'>('default')
  readonly testId = input<string>()
  /** Variación contra el periodo anterior; sin porcentaje cuando la base fue 0 */
  readonly delta = input<{ direction: 'up' | 'down' | 'flat'; percent?: number; absolute: number }>()
  /** El valor como porcentaje de un total */
  readonly percent = input<number>()
  /** Progreso hacia el objetivo, ya saturado a 100 */
  readonly progress = input<number>()
  readonly target = input<number>()

  protected readonly destructive = computed(() => this.variant() === 'destructive')

  protected signed(value: number): string {
    return value > 0 ? `+${value}` : `${value}`
  }
}
