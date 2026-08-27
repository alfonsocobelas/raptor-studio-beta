import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { DashboardService } from '../../../core/services/dashboard.service'
import { KpiCardComponent } from '../../../shared/components/kpi-card'
import { deltaOf, percentOf, progressOf, type KpiDelta } from '../../../core/services/kpi-math'
import type { KpiValue } from '../../../core/services/dashboard.service'
import { ContractsListComponent } from '../bounded-contexts/sap-licensing/features/contracts/contracts-list.component'

/**
 * Dashboard de la app: el total de cada recurso en una KPI card. Los KPIs de dominio
 * (agregados, gráficos, umbrales) son presentación a medida: van en los huecos @ai.
 */
@Component({
  selector: 'app-dashboard',
  imports: [KpiCardComponent, ContractsListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground">Visión general</p>
      </div>

      @if (service.loading()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando datos…</p>
      } @else if (service.loadError()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudieron cargar los datos</p>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <app-kpi-card
            title="Contratos"
            [value]="service.contractsTotal()"
            subtitle="Gestión de contratos SAP y acuerdos de licenciamiento"
            testId="kpi-contracts"
          />
          <app-kpi-card
            title="Proyectos"
            [value]="service.projectsTotal()"
            subtitle="Proyectos de implementación SAP asociados a clientes"
            testId="kpi-projects"
          />
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="bg-card rounded-lg border p-4" data-testid="count-by-contractsByContractType">
            <h2 class="mb-3 text-sm font-semibold">Contratos por tipo</h2>
            @if (service.contractsByContractType.hasValue()) {
              <div class="space-y-2">
                @for (
                  bar of bars(service.contractsByContractType.value(), [
                    'Cloud',
                    'On-premise',
                    'Mixto',
                    'Mantenimiento'
                  ]);
                  track bar.label
                ) {
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-muted-foreground w-28 shrink-0 truncate">{{ bar.label }}</span>
                    <div class="bg-muted h-3 flex-1 overflow-hidden rounded-sm">
                      <div class="bg-primary h-full rounded-sm" [style.width.%]="bar.width"></div>
                    </div>
                    <span class="w-8 text-right tabular-nums">{{ bar.count }}</span>
                  </div>
                }
              </div>
            }
          </div>
          <div class="bg-card rounded-lg border p-4" data-testid="count-by-contractsByContractTypeSumTotalValue">
            <h2 class="mb-3 text-sm font-semibold">Valor por tipo de contrato</h2>
            @if (service.contractsByContractTypeSumTotalValue.hasValue()) {
              <div class="space-y-2">
                @for (
                  bar of bars(service.contractsByContractTypeSumTotalValue.value(), [
                    'Cloud',
                    'On-premise',
                    'Mixto',
                    'Mantenimiento'
                  ]);
                  track bar.label
                ) {
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-muted-foreground w-28 shrink-0 truncate">{{ bar.label }}</span>
                    <div class="bg-muted h-3 flex-1 overflow-hidden rounded-sm">
                      <div class="bg-primary h-full rounded-sm" [style.width.%]="bar.width"></div>
                    </div>
                    <span class="w-8 text-right tabular-nums">{{ bar.count }}</span>
                  </div>
                }
              </div>
            }
          </div>
          <app-kpi-card
            title="Proyectos en planificación"
            [value]="kpiText(service.projectsKpiStatusEqPlanningValue(), 'count')"
            testId="kpi-projectsKpiStatusEqPlanning"
          />
          <app-kpi-card
            title="Altas de cloud este mes"
            [value]="kpiText(service.contractsKpiContractTypeEqCloudStartDateMonthDeltaSparkValue(), 'count')"
            [delta]="delta(service.contractsKpiContractTypeEqCloudStartDateMonthDeltaSpark.value())"
            [spark]="service.contractsKpiContractTypeEqCloudStartDateMonthDeltaSpark.value()?.spark"
            testId="kpi-contractsKpiContractTypeEqCloudStartDateMonthDeltaSpark"
          />
          <app-kpi-card
            title="Proyectos cerrados"
            [value]="kpiText(service.projectsKpiStatusEqClosedRatioValue(), 'count')"
            [percent]="percent(service.projectsKpiStatusEqClosedRatio.value())"
            testId="kpi-projectsKpiStatusEqClosedRatio"
          />
          <app-kpi-card
            title="Contratos del año"
            [value]="kpiText(service.contractsKpiTotalTarget60Value(), 'count')"
            [progress]="progress(service.contractsKpiTotalTarget60.value(), 60)"
            [target]="60"
            testId="kpi-contractsKpiTotalTarget60"
          />
          <app-kpi-card
            title="Valor contratado"
            [value]="kpiText(service.contractsKpiSumTotalValueValue(), 'numeric')"
            testId="kpi-contractsKpiSumTotalValue"
          />
          <app-kpi-card
            title="Valor medio de cloud"
            [value]="kpiText(service.contractsKpiAvgTotalValueContractTypeEqCloudValue(), 'numeric')"
            testId="kpi-contractsKpiAvgTotalValueContractTypeEqCloud"
          />
          <div class="bg-card rounded-lg border p-4" data-testid="top-contractsTopTotalValue5Desc">
            <h2 class="mb-3 text-sm font-semibold">Mayores contratos</h2>
            @if (service.contractsTopTotalValue5Desc.hasValue()) {
              <ol class="space-y-2">
                @for (row of service.contractsTopTotalValue5Desc.value(); track $index) {
                  <li class="flex items-center gap-2 text-sm">
                    <span class="text-muted-foreground w-6 shrink-0 tabular-nums">{{ $index + 1 }}</span>
                    <span class="flex-1 truncate">{{ row['contractNumber'] }}</span>
                    <span class="text-right tabular-nums">{{ row['totalValue'] }}</span>
                  </li>
                }
              </ol>
            }
          </div>
          <div class="bg-card rounded-lg border p-4" data-testid="series-contractsSeriesStartDate">
            <h2 class="mb-3 text-sm font-semibold">Altas de contrato por mes</h2>
            @if (service.contractsSeriesStartDate.hasValue()) {
              <div class="flex items-end gap-1">
                @for (point of points(service.contractsSeriesStartDate.value()); track point.label) {
                  <div class="flex flex-1 flex-col items-center gap-1">
                    <!-- carril de altura fija: un % necesita un padre con altura definida -->
                    <div class="flex h-24 w-full items-end">
                      <div
                        class="bg-primary w-full rounded-t-sm"
                        [style.height.%]="point.height"
                        [title]="point.count"
                      ></div>
                    </div>
                    <span class="text-muted-foreground text-[10px]">{{ point.label }}</span>
                  </div>
                }
              </div>
            }
          </div>
          <div class="bg-card rounded-lg border p-4" data-testid="series-contractsSeriesStartDateSumTotalValue">
            <h2 class="mb-3 text-sm font-semibold">Valor contratado por mes</h2>
            @if (service.contractsSeriesStartDateSumTotalValue.hasValue()) {
              <div class="flex items-end gap-1">
                @for (point of points(service.contractsSeriesStartDateSumTotalValue.value()); track point.label) {
                  <div class="flex flex-1 flex-col items-center gap-1">
                    <!-- carril de altura fija: un % necesita un padre con altura definida -->
                    <div class="flex h-24 w-full items-end">
                      <div
                        class="bg-primary w-full rounded-t-sm"
                        [style.height.%]="point.height"
                        [title]="point.count"
                      ></div>
                    </div>
                    <span class="text-muted-foreground text-[10px]">{{ point.label }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <app-contracts-list [embedded]="true" />

        <!-- @ai:begin dashboard-extra — secciones de dominio (gráficos, listados destacados) -->
        <!-- @ai:end -->
      }
    </div>
  `
})
export class DashboardComponent {
  protected readonly service = inject(DashboardService)

  bars(counts: number[], labels: string[]): { label: string; count: number; width: number }[] {
    const max = Math.max(...counts, 1)
    return counts.map((count, index) => ({ label: labels[index], count, width: (count / max) * 100 }))
  }

  points(values: { label: string; count: number }[]): { label: string; count: number; height: number }[] {
    const max = Math.max(...values.map(v => v.count), 1)
    return values.map(v => ({ ...v, height: (v.count / max) * 100 }))
  }

  kpiText(value: number | null, kind: 'count' | 'numeric' | 'date'): string {
    if (value === null) return '—'
    if (kind === 'date') return new Date(value).toLocaleDateString('es-ES')
    return value.toLocaleString('es-ES')
  }

  delta(value: KpiValue | undefined): KpiDelta | undefined {
    // sin dato o sin periodo anterior no hay variación: comparar contra un cero inventado mentiría
    if (value?.value === null || value?.value === undefined) return undefined
    if (value.previous === null || value.previous === undefined) return undefined
    return deltaOf(value.value, value.previous)
  }

  percent(value: KpiValue | undefined): number {
    return percentOf(value?.value ?? 0, value?.total ?? 0)
  }

  progress(value: KpiValue | undefined, target: number): number {
    return progressOf(value?.value ?? 0, target)
  }
}
