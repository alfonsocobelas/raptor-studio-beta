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

  readonly propiedades = this._total('/api/v1/propiedades')
  readonly propiedadesTotal = computed(() => (this.propiedades.hasValue() ? this.propiedades.value().total : 0))

  readonly visitas = this._total('/api/v1/visitas')
  readonly visitasTotal = computed(() => (this.visitas.hasValue() ? this.visitas.value().total : 0))

  readonly agentes = this._total('/api/v1/agentes')
  readonly agentesTotal = computed(() => (this.agentes.hasValue() ? this.agentes.value().total : 0))

  readonly loading = computed(
    () => this.propiedades.isLoading() || this.visitas.isLoading() || this.agentes.isLoading()
  )
  readonly loadError = computed(
    () =>
      this.propiedades.error() !== undefined || this.visitas.error() !== undefined || this.agentes.error() !== undefined
  )

  private _total(api: string) {
    return resource<PaginatedTotal, unknown>({
      loader: () => firstValueFrom(this._http.get<PaginatedTotal>(api, { params: { page: '1', pageSize: '1' } }))
    })
  }

  // @ai:begin dashboard-service-extra — agregados de dominio (cargas propias, computed)
  // @ai:end
}
