import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import { ExportFormat, LicenseWithConsumptionDto } from '@app/shared/domain'
import { firstValueFrom } from 'rxjs'
import { ColumnFilter, SortOrder } from '../../shared/components/data-table'
import { API_PREFIX } from '../http/api.constants'
import { OffsetPaginatedOutput } from './pagination.types'
import { parseContentDispositionFilename } from './export-filename'

export type { OffsetPaginatedOutput } from './pagination.types'

const API_URL = `${API_PREFIX}/licenses`

export interface LicenseRequest {
  page: number
  pageSize: number
  search?: string
  filters?: ColumnFilter[]
  orders?: SortOrder[]
}

const defaultRequest = (): LicenseRequest => ({ page: 1, pageSize: 10 })

@Injectable({ providedIn: 'root' })
export class LicenseService {
  private readonly _http = inject(HttpClient)

  readonly request = signal<LicenseRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly licenses = resource<OffsetPaginatedOutput<LicenseWithConsumptionDto>, LicenseRequest>({
    params: () => this.request(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<LicenseWithConsumptionDto>>(API_URL, {
          params: this.buildParams(req)
        })
      )
  })

  /** Carga un registro por id: la ficha (spec 16) y la etiqueta del lookup al editar (spec 66). */
  findOne(id: string): Promise<LicenseWithConsumptionDto> {
    return firstValueFrom(this._http.get<LicenseWithConsumptionDto>(`${API_URL}/${id}`))
  }

  /** Typeahead de referencias (spec 66): búsqueda propia y paginada, SIN tocar el request compartido. */
  lookup(search: string, page = 1): Promise<{ items: LicenseWithConsumptionDto[]; hasMore: boolean }> {
    return firstValueFrom(
      this._http.get<OffsetPaginatedOutput<LicenseWithConsumptionDto>>(API_URL, {
        params: this.buildParams({ page, pageSize: 20, ...(search ? { search } : {}) })
      })
    ).then(result => ({ items: result.items, hasMore: page * 20 < result.total }))
  }

  // Downloads the full filtered license set from the backend, matching the current filters and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get(`${API_URL}/export`, { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition'), `licencias.${format}`)
    return { blob, filename }
  }

  private buildParams(req: LicenseRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: LicenseRequest): Record<string, string> {
    const params: Record<string, string> = {}

    // The DataTable already emits operators in backend vocabulary (eq/starts_with/…), so no mapping:
    // just drop the display-only columnLabel and rename column → field.
    const filters = (req.filters ?? []).map(f => ({ field: f.column, operator: f.operator, value: f.value }))

    if (req.search) {
      params['search'] = req.search
    }

    if (filters.length) {
      params['filters'] = JSON.stringify(filters)
    }

    if (req.orders?.length) {
      params['orders'] = JSON.stringify(req.orders)
    }

    return params
  }

  // @ai:begin service-extra — endpoints a medida del módulo
  // @ai:end
}
