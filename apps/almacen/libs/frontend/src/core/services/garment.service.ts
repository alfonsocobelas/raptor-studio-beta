import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import { ExportFormat, GarmentDto, RegisterGarmentDto, UpdateGarmentDto } from '@app/shared/domain'
import { firstValueFrom } from 'rxjs'
import { ColumnFilter, SortOrder } from '../../shared/components/data-table'
import { parseContentDispositionFilename } from './export-filename'

export interface OffsetPaginatedOutput<T> {
  total: number
  page: number
  pageSize: number
  totalPages: number
  items: T[]
}

export interface GarmentRequest {
  page: number
  pageSize: number
  search?: string
  filters?: ColumnFilter[]
  orders?: SortOrder[]
}

const defaultRequest = (): GarmentRequest => ({ page: 1, pageSize: 10 })

@Injectable({ providedIn: 'root' })
export class GarmentService {
  private readonly _http = inject(HttpClient)

  readonly request = signal<GarmentRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly garments = resource<OffsetPaginatedOutput<GarmentDto>, GarmentRequest>({
    params: () => this.request(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<GarmentDto>>('/api/v1/garments', {
          params: this.buildParams(req)
        })
      )
  })

  create(dto: RegisterGarmentDto): Promise<void> {
    return firstValueFrom(this._http.post<void>('/api/v1/garments', dto)).then(() => {
      this.garments.reload()
    })
  }

  update(id: string, dto: UpdateGarmentDto): Promise<void> {
    return firstValueFrom(this._http.put<void>(`/api/v1/garments/${id}`, dto)).then(() => {
      this.garments.reload()
    })
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this._http.delete<void>(`/api/v1/garments/${id}`)).then(() => {
      this.garments.reload()
    })
  }

  // Downloads the full filtered garment set from the backend, matching the current filters and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get('/api/v1/garments/export', { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition'), `prendas.${format}`)
    return { blob, filename }
  }

  private buildParams(req: GarmentRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: GarmentRequest): Record<string, string> {
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
