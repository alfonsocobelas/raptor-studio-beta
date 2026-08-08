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
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <app-kpi-card
            title="Propiedades"
            [value]="service.propiedadesTotal()"
            subtitle="Cartera viva de la agencia · pulsa una propiedad para ver sus visitas"
            testId="kpi-propiedades"
          />
          <app-kpi-card title="Visitas" [value]="service.visitasTotal()" testId="kpi-visitas" />
          <app-kpi-card title="Agentes" [value]="service.agentesTotal()" testId="kpi-agentes" />
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
