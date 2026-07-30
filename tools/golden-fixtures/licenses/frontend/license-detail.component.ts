import { DecimalPipe } from '@angular/common'
import { HttpErrorResponse } from '@angular/common/http'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { lucideArrowLeft } from '@ng-icons/lucide'
import { toast } from '@spartan-ng/brain/sonner'
import { HlmBadgeImports } from '@spartan-ng/helm/badge'
import { HlmButtonImports } from '@spartan-ng/helm/button'
import { HlmCardImports } from '@spartan-ng/helm/card'
import { HlmFieldImports } from '@spartan-ng/helm/field'
import { HlmInputImports } from '@spartan-ng/helm/input'
import { HlmSelectImports } from '@spartan-ng/helm/select'
import { HlmSeparatorImports } from '@spartan-ng/helm/separator'
import { ConsumptionSourceEnum } from '@sap-licenses/shared/domain'
import { AuthService } from '../../../../../../core/services/auth.service'
import { LicenseDetailService } from '../../../../../../core/services/license-detail.service'
import { KpiCardComponent } from '../../../../../../shared/components/kpi-card'
import { generateId } from '../../../../../../shared/utils/uuid'

const HEALTH_LABELS: Record<string, string> = {
  healthy: 'Saludable',
  underused: 'Infrautilizada',
  overused: 'Sobreuso',
  contractual_breach: 'Infracción contractual'
}

const HEALTH_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  healthy: 'default',
  underused: 'outline',
  overused: 'secondary',
  contractual_breach: 'destructive'
}

const HISTORY_MONTHS = 6

@Component({
  selector: 'app-license-detail',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    NgIcon,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    HlmSeparatorImports,
    KpiCardComponent
  ],
  providers: [provideIcons({ lucideArrowLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      @if (license(); as lic) {
        <div class="flex items-center gap-3">
          <button hlmBtn variant="ghost" size="icon-sm" (click)="goBack()">
            <ng-icon name="lucideArrowLeft" />
          </button>
          <div class="flex-1">
            <h1 class="text-2xl font-bold tracking-tight">{{ lic.solutionName }}</h1>
            <p class="text-muted-foreground">
              {{ lic.customerName }} &middot;
              <button class="hover:underline" (click)="navigateToContract()">Contrato {{ lic.contractNumber }}</button>
            </p>
          </div>
        </div>

        <hlm-separator />

        <div class="grid gap-4 sm:grid-cols-3">
          <app-kpi-card
            title="Unidades licenciadas"
            [value]="(lic.licensedUnits | number) ?? ''"
            [subtitle]="lic.metric"
          />
          <app-kpi-card
            title="Consumo actual"
            [value]="(lic.currentUnits | number) ?? ''"
            [valueSuffix]="'(' + lic.consumptionPct.toFixed(1) + '%)'"
          />
          <section hlmCard>
            <div hlmCardHeader><h3 class="text-sm font-medium" hlmCardTitle>Estado de salud</h3></div>
            <div hlmCardContent>
              <span class="text-xs" [variant]="healthVariant(lic.healthStatus)" hlmBadge>
                {{ healthLabel(lic.healthStatus) }}
              </span>
            </div>
          </section>
        </div>

        <section class="space-y-4">
          <h2 class="text-lg font-semibold">Historial de consumo (últimos 6 meses)</h2>
          <div class="rounded-md border">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b">
                <tr class="border-b">
                  <th class="h-10 px-4 text-left font-medium">Periodo</th>
                  <th class="h-10 px-4 text-left font-medium">Unidades</th>
                  <th class="h-10 px-4 text-left font-medium" style="min-width: 200px">Progreso</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                @for (record of history(); track record.id) {
                  <tr class="hover:bg-muted/50 border-b transition-colors">
                    <td class="p-4">{{ record.periodYear }}-{{ padMonth(record.periodMonth) }}</td>
                    <td class="p-4">{{ record.units | number }}</td>
                    <td class="p-4">
                      <div class="flex items-center gap-2">
                        <div class="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                          @if (historyPct(record.units); as pct) {
                            <div
                              class="h-full rounded-full transition-all"
                              [style.width.%]="Math.min(pct, 100)"
                              [class]="progressColor(pct)"
                            ></div>
                          }
                        </div>
                        <span class="text-muted-foreground w-12 text-right text-xs">
                          {{ historyPctLabel(record.units) }}
                        </span>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Registrar consumo es una escritura: el backend la rechaza con 403 para un viewer. -->
        @if (canWrite()) {
          <section class="space-y-4">
            <h2 class="text-lg font-semibold">Registrar consumo manual</h2>
            <section hlmCard>
              <div class="pt-6" hlmCardContent>
                <form
                  class="flex flex-wrap items-end gap-4"
                  [formGroup]="consumptionForm"
                  (ngSubmit)="submitConsumption()"
                >
                  <hlm-field>
                    <label hlmFieldLabel for="cpYear">Año</label>
                    <input id="cpYear" type="number" class="w-24" hlmInput formControlName="periodYear" />
                  </hlm-field>
                  <hlm-field>
                    <label hlmFieldLabel for="cpMonth">Mes</label>
                    <hlm-select class="w-24" formControlName="periodMonth" [itemToString]="monthToLabel">
                      <hlm-select-trigger buttonId="cpMonth">
                        <hlm-select-value />
                      </hlm-select-trigger>
                      <hlm-select-content *hlmSelectPortal>
                        @for (m of months; track m) {
                          <hlm-select-item [value]="m">{{ padMonth(m) }}</hlm-select-item>
                        }
                      </hlm-select-content>
                    </hlm-select>
                  </hlm-field>
                  <hlm-field>
                    <label hlmFieldLabel for="cpUnits">Unidades</label>
                    <input id="cpUnits" type="number" class="w-32" hlmInput formControlName="units" />
                  </hlm-field>
                  <button type="submit" [disabled]="consumptionForm.invalid" hlmBtn size="sm">Registrar</button>
                </form>
              </div>
            </section>
          </section>
        }
      } @else {
        <p class="text-muted-foreground">Licencia no encontrada.</p>
      }
    </div>
  `
})
export class LicenseDetailComponent {
  protected readonly Math = Math

  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)
  private readonly _fb = inject(FormBuilder)
  private readonly _service = inject(LicenseDetailService)
  protected readonly canWrite = inject(AuthService).canWrite

  readonly months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  readonly license = this._service.license.value

  readonly history = computed(() =>
    [...(this.license()?.consumption ?? [])]
      .sort((a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth)
      .slice(0, HISTORY_MONTHS)
  )

  readonly consumptionForm = this._fb.nonNullable.group({
    periodYear: [new Date().getFullYear(), [Validators.required]],
    periodMonth: [new Date().getMonth() + 1, [Validators.required]],
    units: [0, [Validators.required, Validators.min(0)]]
  })

  constructor() {
    this._service.licenseId.set(this._route.snapshot.paramMap.get('id') ?? undefined)
  }

  padMonth(month: number): string {
    return month.toString().padStart(2, '0')
  }

  // itemToString: con el popover cerrado los items no están instanciados y el trigger
  // mostraría el número crudo sin el cero inicial.
  readonly monthToLabel = (value: unknown): string => this.padMonth(Number(value))

  healthLabel(status: string): string {
    return HEALTH_LABELS[status] ?? status
  }

  healthVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    return HEALTH_VARIANTS[status] ?? 'secondary'
  }

  // El % de cada fila deriva del snapshot (misma fuente que la card, spec 48): el techo implícito
  // es currentUnits × 100 / consumptionPct — mismas unidades que los records. El ratio local
  // units/licensedUnits queda PROHIBIDO (mezclaba unidades de métrica con unidades de material:
  // el 10081745% de RBA). Sin ratio en el snapshot → null, nunca un número inventado.
  historyPct(units: number): number | null {
    const lic = this.license()
    if (!lic || lic.consumptionPct <= 0 || lic.currentUnits <= 0) {
      return null
    }
    const impliedCeiling = (lic.currentUnits * 100) / lic.consumptionPct
    return (units / impliedCeiling) * 100
  }

  historyPctLabel(units: number): string {
    const pct = this.historyPct(units)
    return pct === null ? '—' : `${pct.toFixed(0)}%`
  }

  progressColor(pct: number): string {
    if (pct >= 100) {
      return 'bg-destructive'
    }
    if (pct > 95) {
      return 'bg-orange-500'
    }
    if (pct < 40) {
      return 'bg-amber-500'
    }
    return 'bg-primary'
  }

  goBack(): void {
    this._router.navigate(['/sap-licensing/licenses'])
  }

  navigateToContract(): void {
    const lic = this.license()
    if (lic) {
      this._router.navigate(['/sap-licensing/contracts', lic.contractId])
    }
  }

  async submitConsumption(): Promise<void> {
    if (this.consumptionForm.invalid) {
      return
    }
    const { periodYear, periodMonth, units } = this.consumptionForm.getRawValue()
    try {
      await this._service.addConsumption({
        id: generateId(),
        periodYear,
        periodMonth,
        units,
        source: ConsumptionSourceEnum.MANUAL
      })
      toast.success('Consumo registrado correctamente')
      this.consumptionForm.patchValue({ units: 0 })
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        toast.error('Ya existe consumo registrado para ese periodo')
      } else {
        toast.error('No se pudo registrar el consumo')
      }
    }
  }
}
