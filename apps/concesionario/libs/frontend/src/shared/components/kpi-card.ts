import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { MatCardModule } from '@angular/material/card'

/** Tarjeta de indicador (piel Material). Misma API que la implementación Spartan. */
@Component({
  selector: 'app-kpi-card',
  imports: [MatCardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card appearance="outlined" [attr.data-testid]="testId()">
      <mat-card-content>
        <p class="mat-label-medium opacity-70">{{ title() }}</p>
        <p class="mat-headline-medium tabular-nums" [class.mat-warn]="variant() === 'destructive'">
          {{ value() }}<span class="mat-body-medium">{{ valueSuffix() }}</span>
        </p>
        @if (subtitle()) {
          <p class="mat-body-small opacity-70">{{ subtitle() }}</p>
        }
      </mat-card-content>
    </mat-card>
  `
})
export class KpiCard {
  readonly title = input.required<string>()
  readonly value = input.required<string | number>()
  readonly subtitle = input<string>()
  readonly valueSuffix = input<string>()
  readonly variant = input<'default' | 'destructive'>('default')
  readonly testId = input<string>()
}
