import { HttpClient } from '@angular/common/http'
import { Injectable, computed, inject, resource } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { previousRange, windowRange, type KpiRange } from './kpi-window'

interface PaginatedTotal {
  total: number
}

interface KpiFilter {
  field: string
  operator: string
  value: string
}

interface KpiSpec {
  filters: KpiFilter[]
  window?: { field: string; preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'days'; days?: number }
  ratio: boolean
  compare: boolean
  target?: number
}

export interface KpiValue {
  value: number
  /** El mismo conteo en la ventana anterior; solo si la tarjeta compara */
  previous?: number
  /** El total del recurso en la ventana; solo si la tarjeta muestra porcentaje */
  total?: number
}

/**
 * Totales del dashboard: una llamada mínima por recurso (pageSize=1, solo interesa
 * `total`). Los agregados de dominio (sumas, umbrales, distribuciones) se añaden a
 * mano en el hueco @ai — son presentación a medida de cada proyecto.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly _http = inject(HttpClient)

  readonly contracts = this._total('/api/v1/contracts')
  readonly contractsTotal = computed(() => (this.contracts.hasValue() ? this.contracts.value().total : 0))

  readonly projects = this._total('/api/v1/projects')
  readonly projectsTotal = computed(() => (this.projects.hasValue() ? this.projects.value().total : 0))

  readonly contractsByContractType = this._counts('/api/v1/contracts', 'contractType', [
    'cloud',
    'onprem',
    'mixed',
    'maintenance'
  ])

  readonly projectsKpiStatusEqPlanning = this._kpi('/api/v1/projects', {
    filters: [{ field: 'status', operator: 'eq', value: 'planning' }],
    ratio: false,
    compare: false
  })
  readonly projectsKpiStatusEqPlanningValue = computed(() => this.projectsKpiStatusEqPlanning.value()?.value ?? 0)

  readonly contractsSeriesStartDate = this._series('/api/v1/contracts', 'startDate')

  readonly loading = computed(
    () =>
      this.contracts.isLoading() ||
      this.projects.isLoading() ||
      this.contractsByContractType.isLoading() ||
      this.projectsKpiStatusEqPlanning.isLoading() ||
      this.contractsSeriesStartDate.isLoading()
  )
  readonly loadError = computed(
    () =>
      this.contracts.error() !== undefined ||
      this.projects.error() !== undefined ||
      this.contractsByContractType.error() !== undefined ||
      this.projectsKpiStatusEqPlanning.error() !== undefined ||
      this.contractsSeriesStartDate.error() !== undefined
  )

  private _total(api: string) {
    return resource<PaginatedTotal, unknown>({
      loader: () => firstValueFrom(this._http.get<PaginatedTotal>(api, { params: { page: '1', pageSize: '1' } }))
    })
  }

  /** N conteos, uno por valor del enum: el listado ya sabe contar filtrado. */
  private _counts(api: string, field: string, values: string[]) {
    return resource<number[], unknown>({
      loader: () =>
        Promise.all(
          values.map(value =>
            firstValueFrom(this._http.get<PaginatedTotal>(api, { params: this._countParams(field, 'eq', value) })).then(
              r => r.total
            )
          )
        )
    })
  }

  /**
   * Una tarjeta KPI (spec 70): el conteo condicionado y, SOLO si el descriptor los pide, el
   * periodo anterior y el total de la ventana. Las ramas que no se piden no llegan a la red:
   * son `Promise.resolve(undefined)`, no peticiones vacías.
   */
  private _kpi(api: string, spec: KpiSpec) {
    return resource<KpiValue, unknown>({ loader: () => this._loadKpi(api, spec) })
  }

  private async _loadKpi(api: string, spec: KpiSpec): Promise<KpiValue> {
    const now = new Date()
    const range = spec.window ? windowRange(spec.window.preset, spec.window.days, now) : undefined
    const scoped = [...spec.filters, ...this._rangeFilters(spec.window?.field, range)]

    const [value, previous, total] = await Promise.all([
      this._countBy(api, scoped),
      spec.compare && spec.window
        ? this._countBy(api, [
            ...spec.filters,
            ...this._rangeFilters(spec.window.field, previousRange(spec.window.preset, spec.window.days, now))
          ])
        : Promise.resolve(undefined),
      spec.ratio ? this._countBy(api, this._rangeFilters(spec.window?.field, range)) : Promise.resolve(undefined)
    ])

    return { value, previous, total }
  }

  private _rangeFilters(field: string | undefined, range: KpiRange | undefined): KpiFilter[] {
    if (!field || !range) return []

    return [
      { field, operator: 'gte', value: range.start },
      { field, operator: 'lt', value: range.end }
    ]
  }

  private _countBy(api: string, filters: KpiFilter[]): Promise<number> {
    const params =
      filters.length === 0
        ? { page: '1', pageSize: '1' }
        : { page: '1', pageSize: '1', filters: JSON.stringify(filters) }

    return firstValueFrom(this._http.get<PaginatedTotal>(api, { params })).then(r => r.total)
  }

  /** Altas por mes, últimos 12 meses: dos filtros de rango por punto. */
  private _series(api: string, field: string) {
    const now = new Date()
    const months = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
      return { label: start.toLocaleDateString('es-ES', { month: 'short' }), start, end }
    })
    return resource<{ label: string; count: number }[], unknown>({
      loader: () =>
        Promise.all(
          months.map(month =>
            firstValueFrom(
              this._http.get<PaginatedTotal>(api, {
                params: {
                  page: '1',
                  pageSize: '1',
                  filters: JSON.stringify([
                    { field, operator: 'gte', value: this._day(month.start) },
                    { field, operator: 'lt', value: this._day(month.end) }
                  ])
                }
              })
            ).then(r => ({ label: month.label, count: r.total }))
          )
        )
    })
  }

  /** El día en hora LOCAL: cortar en UTC descuadra los bordes de mes (spec 70). */
  private _day(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
  }

  private _countParams(field: string, operator: string, value: string) {
    return { page: '1', pageSize: '1', filters: JSON.stringify([{ field, operator, value }]) }
  }

  // @ai:begin dashboard-service-extra — agregados de dominio (cargas propias, computed)
  // @ai:end
}
