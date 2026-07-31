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

  readonly garments = this._total('/api/v1/garments')
  readonly garmentsTotal = computed(() => (this.garments.hasValue() ? this.garments.value().total : 0))

  readonly suppliers = this._total('/api/v1/suppliers')
  readonly suppliersTotal = computed(() => (this.suppliers.hasValue() ? this.suppliers.value().total : 0))

  readonly movements = this._total('/api/v1/movements')
  readonly movementsTotal = computed(() => (this.movements.hasValue() ? this.movements.value().total : 0))

  readonly loading = computed(
    () => this.garments.isLoading() || this.suppliers.isLoading() || this.movements.isLoading()
  )
  readonly loadError = computed(
    () =>
      this.garments.error() !== undefined ||
      this.suppliers.error() !== undefined ||
      this.movements.error() !== undefined
  )

  private _total(api: string) {
    return resource<PaginatedTotal, unknown>({
      loader: () => firstValueFrom(this._http.get<PaginatedTotal>(api, { params: { page: '1', pageSize: '1' } }))
    })
  }

  // @ai:begin dashboard-service-extra — agregados de dominio (cargas propias, computed)
  // @ai:end
}
