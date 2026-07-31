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
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <app-kpi-card
            title="Clientes"
            [value]="service.customersTotal()"
            subtitle="Gestión de clientes SAP"
            testId="kpi-customers"
          />
          <app-kpi-card
            title="Contratos"
            [value]="service.contractsTotal()"
            subtitle="Gestión de contratos SAP y acuerdos de licenciamiento"
            testId="kpi-contracts"
          />
          <app-kpi-card
            title="Licencias"
            [value]="service.licensesTotal()"
            subtitle="Observabilidad del parque de licencias SAP"
            testId="kpi-licenses"
          />
          <app-kpi-card
            title="Proyectos"
            [value]="service.projectsTotal()"
            subtitle="Proyectos de implementación SAP asociados a clientes"
            testId="kpi-projects"
          />
        </div>

        <!-- @ai:begin dashboard-extra — secciones de dominio (gráficos, listados destacados) -->
        <!-- @ai:end -->
      }
    </div>
  `
})
export class DashboardComponent {
  protected readonly service = inject(DashboardService)
}
