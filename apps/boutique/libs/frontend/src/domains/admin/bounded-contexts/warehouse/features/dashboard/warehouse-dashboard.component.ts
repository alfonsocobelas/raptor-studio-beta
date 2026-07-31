import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { BarChartComponent } from '../../../../../../shared/components/bar-chart'
import { KpiCardComponent } from '../../../../../../shared/components/kpi-card'
import { LOW_STOCK_THRESHOLD, WarehouseDashboardService } from '../../../../../../core/services/warehouse-dashboard.service'

const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const UNITS = new Intl.NumberFormat('es-ES')

/**
 * Dashboard del almacén: KPIs de inventario y stock por categoría.
 * Los agregados los deriva WarehouseDashboardService; aquí solo se formatea y pinta.
 */
@Component({
  selector: 'app-warehouse-dashboard',
  imports: [BarChartComponent, KpiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground">Visión general del almacén</p>
      </div>

      @if (loading()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando inventario…</p>
      } @else if (loadError()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudo cargar el inventario</p>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <app-kpi-card
            title="Referencias"
            [value]="totalReferences()"
            subtitle="Prendas distintas en catálogo"
            testId="kpi-references"
          />
          <app-kpi-card
            title="Unidades en stock"
            [value]="totalUnits()"
            subtitle="Suma de todas las tallas"
            testId="kpi-units"
          />
          <app-kpi-card
            title="Valor de inventario"
            [value]="inventoryValue()"
            subtitle="Precio de venta × unidades"
            testId="kpi-value"
          />
          <app-kpi-card
            title="Stock bajo"
            [value]="lowStock()"
            [subtitle]="'Prendas activas con ≤ ' + lowStockThreshold + ' unidades'"
            [variant]="lowStockVariant()"
            testId="kpi-low-stock"
          />
        </div>

        <section class="bg-card rounded-lg border p-6">
          <h2 class="text-sm font-medium">Stock por categoría</h2>
          <p class="text-muted-foreground mb-4 text-xs">Unidades disponibles por familia de producto</p>
          <app-bar-chart [data]="stockByCategory()" valueSuffix="uds." ariaLabel="Unidades en stock por categoría" />
        </section>
      }
    </div>
  `
})
export class WarehouseDashboardComponent {
  private readonly _service = inject(WarehouseDashboardService)

  protected readonly lowStockThreshold = LOW_STOCK_THRESHOLD

  protected readonly loading = this._service.inventory.isLoading
  protected readonly loadError = computed(() => this._service.inventory.error() !== undefined)

  protected readonly totalReferences = computed(() => UNITS.format(this._service.totalReferences()))
  protected readonly totalUnits = computed(() => UNITS.format(this._service.totalUnits()))
  protected readonly inventoryValue = computed(() => EUR.format(this._service.inventoryValue()))
  protected readonly lowStock = computed(() => UNITS.format(this._service.lowStockCount()))
  protected readonly lowStockVariant = computed(() => (this._service.lowStockCount() > 0 ? 'destructive' : 'default'))

  protected readonly stockByCategory = this._service.stockByCategory
}
