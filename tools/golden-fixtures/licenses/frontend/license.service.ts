import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import { ExportFormat, LicenseWithConsumptionDto } from '@sap-licenses/shared/domain'
import { firstValueFrom } from 'rxjs'
import { ColumnFilter, SortOrder } from '../../shared/components/data-table'
import { OffsetPaginatedOutput } from './contract.service'
import { parseContentDispositionFilename } from './export-filename'

export type { OffsetPaginatedOutput } from './contract.service'

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
        this._http.get<OffsetPaginatedOutput<LicenseWithConsumptionDto>>('/api/v1/licenses', {
          params: this.buildParams(req)
        })
      )
  })

  private buildParams(req: LicenseRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Search, filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: LicenseRequest): Record<string, string> {
    const params: Record<string, string> = {}
    if (req.search) {
      params['search'] = req.search
    }
    // The DataTable already emits operators in backend vocabulary (eq/starts_with/…), so no mapping:
    // just drop the display-only columnLabel and rename column → field.
    const filters = (req.filters ?? []).map(f => ({ field: f.column, operator: f.operator, value: f.value }))
    if (filters.length) {
      params['filters'] = JSON.stringify(filters)
    }
    if (req.orders?.length) {
      params['orders'] = JSON.stringify(req.orders)
    }
    return params
  }

  // Downloads the full filtered park from the backend, matching the current search and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get('/api/v1/licenses/export', { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition'), `licencias.${format}`)
    return { blob, filename }
  }
}
