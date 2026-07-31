import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { SaleDto, VehicleDto } from '@app/shared/domain'
import { HlmCardImports } from '@spartan-ng/helm/card'
import { KpiCardComponent } from '../../../../../../shared/components/kpi-card'
import { OffsetPaginatedOutput } from '../../../../../../core/services/sale.service'

interface MonthBar {
  key: string
  label: string
  total: number
  count: number
  x: number
  y: number
  height: number
  isMax: boolean
}

interface TooltipState {
  leftPct: number
  label: string
  total: string
  count: number
}

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Geometría del plot (viewBox fijo; el svg escala con el ancho de la card)
const VIEW_W = 640
const VIEW_H = 240
const PAD = { top: 24, right: 16, bottom: 28, left: 56 }
const PLOT_W = VIEW_W - PAD.left - PAD.right
const PLOT_H = VIEW_H - PAD.top - PAD.bottom
const BAR_MAX_WIDTH = 24

const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

/**
 * Pantalla de inicio: KPIs del inventario/ventas y facturación por mes.
 * Escrita a mano sobre la app generada (los listados CRUD son 100% generados);
 * agrega en cliente porque el volumen de la demo es pequeño — con datos reales
 * iría a un endpoint de agregación propio (@ai service-extra).
 */
@Component({
  selector: 'app-dashboard',
  imports: [HlmCardImports, KpiCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0 space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Inicio</h1>
        <p class="text-muted-foreground">Visión general del concesionario</p>
      </div>

      @if (loading()) {
        <p class="text-muted-foreground py-12 text-center text-sm">Cargando panel…</p>
      } @else if (error()) {
        <p class="text-destructive py-12 text-center text-sm">No se pudo cargar el panel</p>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <app-kpi-card title="Vehículos en stock" [value]="stockCount()" subtitle="Disponibles para venta" />
          <app-kpi-card title="Ventas entregadas" [value]="deliveredCount()" subtitle="Año 2026" />
          <app-kpi-card title="Facturación" [value]="revenueLabel()" subtitle="Entregadas + pdte. entrega" />
          <app-kpi-card title="Ticket medio" [value]="avgTicketLabel()" subtitle="Por operación" />
        </div>

        <section hlmCard class="max-w-4xl">
          <div hlmCardHeader class="pb-2">
            <h3 hlmCardTitle class="text-sm font-medium">Facturación por mes</h3>
            <p class="text-muted-foreground text-xs">Operaciones entregadas y pendientes de entrega (sin canceladas)</p>
          </div>
          <div hlmCardContent>
            <div class="relative">
              <svg [attr.viewBox]="viewBox" class="h-auto w-full" role="img" aria-label="Facturación por mes">
                <!-- grid horizontal (hairline) + ticks del eje Y -->
                @for (tick of yTicks(); track tick.value) {
                  <line
                    [attr.x1]="padLeft"
                    [attr.x2]="viewW - padRight"
                    [attr.y1]="tick.y"
                    [attr.y2]="tick.y"
                    class="stroke-border"
                    stroke-width="1"
                  />
                  <text
                    [attr.x]="padLeft - 8"
                    [attr.y]="tick.y + 3"
                    text-anchor="end"
                    class="fill-muted-foreground"
                    font-size="10"
                    style="font-variant-numeric: tabular-nums"
                  >
                    {{ tick.label }}
                  </text>
                }

                <!-- barras: remate superior redondeado, base cuadrada (clip en la línea base) -->
                <clipPath id="plot-clip">
                  <rect [attr.x]="padLeft" y="0" [attr.width]="plotW" [attr.height]="baselineY" />
                </clipPath>
                <g clip-path="url(#plot-clip)">
                  @for (bar of bars(); track bar.key) {
                    <rect
                      [attr.x]="bar.x"
                      [attr.y]="bar.y"
                      [attr.width]="barWidth"
                      [attr.height]="bar.height + 4"
                      rx="4"
                      [attr.fill]="hovered()?.label === bar.label ? 'var(--chart-series-hover)' : 'var(--chart-series)'"
                    />
                  }
                </g>

                <!-- etiqueta directa solo en el máximo -->
                @for (bar of bars(); track bar.key) {
                  @if (bar.isMax) {
                    <text
                      [attr.x]="bar.x + barWidth / 2"
                      [attr.y]="bar.y - 6"
                      text-anchor="middle"
                      class="fill-foreground"
                      font-size="10"
                      font-weight="600"
                    >
                      {{ compact(bar.total) }}
                    </text>
                  }
                  <text
                    [attr.x]="bar.x + barWidth / 2"
                    [attr.y]="baselineY + 16"
                    text-anchor="middle"
                    class="fill-muted-foreground"
                    font-size="10"
                  >
                    {{ bar.label }}
                  </text>
                }

                <!-- línea base -->
                <line
                  [attr.x1]="padLeft"
                  [attr.x2]="viewW - padRight"
                  [attr.y1]="baselineY"
                  [attr.y2]="baselineY"
                  class="stroke-muted-foreground/40"
                  stroke-width="1"
                />

                <!-- hit targets de hover: toda la banda del mes, más ancha que la barra -->
                @for (bar of bars(); track bar.key) {
                  <rect
                    [attr.x]="bar.x - (bandWidth() - barWidth) / 2"
                    y="0"
                    [attr.width]="bandWidth()"
                    [attr.height]="baselineY"
                    fill="transparent"
                    (mouseenter)="showTooltip(bar)"
                    (mouseleave)="hovered.set(null)"
                  />
                }
              </svg>

              @if (hovered(); as tip) {
                <div
                  class="bg-popover text-popover-foreground pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border px-3 py-2 text-xs shadow-md"
                  [style.left.%]="tip.leftPct"
                >
                  <p class="font-semibold">{{ tip.label }}</p>
                  <p>{{ tip.total }}</p>
                  <p class="text-muted-foreground">{{ tip.count }} {{ tip.count === 1 ? 'operación' : 'operaciones' }}</p>
                </div>
              }
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    :host {
      --chart-series: #2a78d6;
      --chart-series-hover: #1c5cab;
    }
    :host-context(.dark) {
      --chart-series: #3987e5;
      --chart-series-hover: #6da7ec;
    }
  `
})
export class DashboardComponent {
  private readonly _http = inject(HttpClient)

  protected readonly viewW = VIEW_W
  protected readonly viewBox = `0 0 ${VIEW_W} ${VIEW_H}`
  protected readonly padLeft = PAD.left
  protected readonly padRight = PAD.right
  protected readonly plotW = PLOT_W
  protected readonly baselineY = PAD.top + PLOT_H
  protected readonly barWidth = BAR_MAX_WIDTH

  protected readonly hovered = signal<TooltipState | null>(null)

  private readonly _sales = resource({
    loader: () =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<SaleDto>>('/api/v1/sales', { params: { page: 1, pageSize: 100 } })
      )
  })

  private readonly _vehicles = resource({
    loader: () =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<VehicleDto>>('/api/v1/vehicles', { params: { page: 1, pageSize: 100 } })
      )
  })

  protected readonly loading = computed(() => this._sales.isLoading() || this._vehicles.isLoading())
  protected readonly error = computed(() => this._sales.error() ?? this._vehicles.error())

  private readonly _activeSales = computed(() =>
    (this._sales.value()?.items ?? []).filter(sale => sale.status !== 'cancelled')
  )

  protected readonly stockCount = computed(
    () => (this._vehicles.value()?.items ?? []).filter(vehicle => vehicle.status === 'stock').length
  )
  protected readonly deliveredCount = computed(
    () => (this._sales.value()?.items ?? []).filter(sale => sale.status === 'delivered').length
  )
  private readonly _revenue = computed(() =>
    this._activeSales().reduce((sum, sale) => sum + sale.amount - sale.discount, 0)
  )
  protected readonly revenueLabel = computed(() => currency.format(this._revenue()))
  protected readonly avgTicketLabel = computed(() => {
    const count = this._activeSales().length
    return currency.format(count === 0 ? 0 : this._revenue() / count)
  })

  private readonly _monthly = computed(() => {
    const byMonth = new Map<string, { total: number; count: number }>()
    for (const sale of this._activeSales()) {
      const key = sale.saleDate.slice(0, 7)
      const entry = byMonth.get(key) ?? { total: 0, count: 0 }
      entry.total += sale.amount - sale.discount
      entry.count += 1
      byMonth.set(key, entry)
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([key, entry]) => ({ key, ...entry }))
  })

  private readonly _niceMax = computed(() => {
    const max = Math.max(...this._monthly().map(m => m.total), 1)
    const step = 25_000
    return Math.ceil(max / step) * step
  })

  protected readonly yTicks = computed(() => {
    const max = this._niceMax()
    const ticks = 4
    return Array.from({ length: ticks + 1 }, (_, i) => {
      const value = (max / ticks) * i
      return {
        value,
        y: this.baselineY - (value / max) * PLOT_H,
        label: value === 0 ? '0' : `${Math.round(value / 1000)}k`
      }
    })
  })

  protected readonly bandWidth = computed(() => PLOT_W / Math.max(this._monthly().length, 1))

  protected readonly bars = computed<MonthBar[]>(() => {
    const months = this._monthly()
    const max = this._niceMax()
    const band = PLOT_W / Math.max(months.length, 1)
    const highest = Math.max(...months.map(m => m.total), 0)
    return months.map((month, i) => {
      const height = (month.total / max) * PLOT_H
      const monthIndex = Number(month.key.slice(5, 7)) - 1
      return {
        key: month.key,
        label: `${MONTH_LABELS[monthIndex]} ${month.key.slice(2, 4)}`,
        total: month.total,
        count: month.count,
        x: PAD.left + band * i + (band - BAR_MAX_WIDTH) / 2,
        y: this.baselineY - height,
        height,
        isMax: month.total === highest && highest > 0
      }
    })
  })

  protected showTooltip(bar: MonthBar): void {
    this.hovered.set({
      leftPct: ((bar.x + BAR_MAX_WIDTH / 2) / VIEW_W) * 100,
      label: bar.label,
      total: currency.format(bar.total),
      count: bar.count
    })
  }

  protected compact(value: number): string {
    return `${Math.round(value / 1000)}k €`
  }
}
