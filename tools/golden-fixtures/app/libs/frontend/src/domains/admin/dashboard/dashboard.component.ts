import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { DashboardService } from '../../../core/services/dashboard.service'
import { KpiCardComponent } from '../../../shared/components/kpi-card'

/**
 * Dashboard de la app: el total de cada recurso en una KPI card. Los KPIs de dominio
 * (agregados, gráficos, umbrales) son presentación a medida: van en los huecos @ai.
 */
@Component({
  selector: 'app-dashboard',
  imports: [KpiCardComponent],
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
          <app-kpi-card
            title="Proyectos en planificación"
            [value]="service.projectsWhereStatusPlanningTotal()"
            testId="kpi-count-projectsWhereStatusPlanning"
          />
          <div class="bg-card rounded-lg border p-4" data-testid="series-contractsSeriesStartDate">
            <h2 class="mb-3 text-sm font-semibold">Altas de contrato por mes</h2>
            @if (service.contractsSeriesStartDate.hasValue()) {
              <div class="flex h-28 items-end gap-1">
                @for (point of points(service.contractsSeriesStartDate.value()); track point.label) {
                  <div class="flex flex-1 flex-col items-center gap-1">
                    <div
                      class="bg-primary w-full rounded-t-sm"
                      [style.height.%]="point.height"
                      [title]="point.count"
                    ></div>
                    <span class="text-muted-foreground text-[10px]">{{ point.label }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

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
}
