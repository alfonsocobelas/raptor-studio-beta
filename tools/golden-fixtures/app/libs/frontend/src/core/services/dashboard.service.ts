import { HttpClient } from '@angular/common/http'
import { Injectable, computed, inject, resource } from '@angular/core'
import { firstValueFrom } from 'rxjs'

interface PaginatedTotal {
  total: number
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

  readonly projectsWhereStatusPlanning = this._countWhere('/api/v1/projects', 'status', 'planning')
  readonly projectsWhereStatusPlanningTotal = computed(() =>
    this.projectsWhereStatusPlanning.hasValue() ? this.projectsWhereStatusPlanning.value() : 0
  )

  readonly contractsSeriesStartDate = this._series('/api/v1/contracts', 'startDate')

  readonly loading = computed(
    () =>
      this.contracts.isLoading() ||
      this.projects.isLoading() ||
      this.contractsByContractType.isLoading() ||
      this.projectsWhereStatusPlanning.isLoading() ||
      this.contractsSeriesStartDate.isLoading()
  )
  readonly loadError = computed(
    () =>
      this.contracts.error() !== undefined ||
      this.projects.error() !== undefined ||
      this.contractsByContractType.error() !== undefined ||
      this.projectsWhereStatusPlanning.error() !== undefined ||
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

  /** Un conteo condicionado: cuántos cumplen field = value. */
  private _countWhere(api: string, field: string, value: string) {
    return resource<number, unknown>({
      loader: () =>
        firstValueFrom(this._http.get<PaginatedTotal>(api, { params: this._countParams(field, 'eq', value) })).then(
          r => r.total
        )
    })
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

  private _day(date: Date): string {
    return date.toISOString().slice(0, 10)
  }

  private _countParams(field: string, operator: string, value: string) {
    return { page: '1', pageSize: '1', filters: JSON.stringify([{ field, operator, value }]) }
  }

  // @ai:begin dashboard-service-extra — agregados de dominio (cargas propias, computed)
  // @ai:end
}
