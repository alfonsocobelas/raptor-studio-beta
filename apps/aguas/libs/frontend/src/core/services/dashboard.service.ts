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

  readonly muestras = this._total('/api/v1/muestras')
  readonly muestrasTotal = computed(() => (this.muestras.hasValue() ? this.muestras.value().total : 0))

  readonly puntos = this._total('/api/v1/puntos')
  readonly puntosTotal = computed(() => (this.puntos.hasValue() ? this.puntos.value().total : 0))

  readonly clientes = this._total('/api/v1/clientes')
  readonly clientesTotal = computed(() => (this.clientes.hasValue() ? this.clientes.value().total : 0))

  readonly loading = computed(() => this.muestras.isLoading() || this.puntos.isLoading() || this.clientes.isLoading())
  readonly loadError = computed(
    () =>
      this.muestras.error() !== undefined || this.puntos.error() !== undefined || this.clientes.error() !== undefined
  )

  private _total(api: string) {
    return resource<PaginatedTotal, unknown>({
      loader: () => firstValueFrom(this._http.get<PaginatedTotal>(api, { params: { page: '1', pageSize: '1' } }))
    })
  }

  // @ai:begin dashboard-service-extra — agregados de dominio (cargas propias, computed)
  // @ai:end
}
