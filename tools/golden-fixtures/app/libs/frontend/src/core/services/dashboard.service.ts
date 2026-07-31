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

  readonly loading = computed(() => this.contracts.isLoading() || this.projects.isLoading())
  readonly loadError = computed(() => this.contracts.error() !== undefined || this.projects.error() !== undefined)

  private _total(api: string) {
    return resource<PaginatedTotal, unknown>({
      loader: () => firstValueFrom(this._http.get<PaginatedTotal>(api, { params: { page: '1', pageSize: '1' } }))
    })
  }

  // @ai:begin dashboard-service-extra — agregados de dominio (cargas propias, computed)
  // @ai:end
}
