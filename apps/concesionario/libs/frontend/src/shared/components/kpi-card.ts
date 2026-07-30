import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { HlmCardImports } from '@spartan-ng/helm/card'

/**
 * Tarjeta KPI (título discreto + valor protagonista). Componente presentacional:
 * `value` llega ya formateado desde la pantalla (moneda, %, pipes).
 */
@Component({
  selector: 'app-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmCardImports],
  // block h-full: el host llena la celda del grid y la card interior el host, para que las
  // cards de una misma fila queden alineadas en altura aunque su contenido difiera (spec 47).
  host: { class: 'block h-full' },
  template: `
    <section hlmCard class="h-full" [class.border-destructive/30]="destructive()" [attr.data-testid]="testId() ?? null">
      <div class="pb-2" hlmCardHeader>
        <h3
          class="text-sm font-medium"
          [class.text-muted-foreground]="!destructive()"
          [class.text-destructive]="destructive()"
          hlmCardTitle
        >
          {{ title() }}
        </h3>
      </div>
      <div hlmCardContent>
        <p class="text-2xl font-bold" [class.text-destructive]="destructive()">
          {{ value() }}
          @if (valueSuffix(); as suffix) {
            <span class="text-muted-foreground text-sm font-normal">{{ suffix }}</span>
          }
        </p>
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

  protected readonly destructive = computed(() => this.variant() === 'destructive')
}
