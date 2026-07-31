import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import { ExportFormat, MovementDto, RegisterMovementDto, UpdateMovementDto } from '@app/shared/domain'
import { firstValueFrom } from 'rxjs'
import { ColumnFilter, SortOrder } from '../../shared/components/data-table'
import { API_PREFIX } from '../http/api.constants'
import { OffsetPaginatedOutput } from './pagination.types'
import { parseContentDispositionFilename } from './export-filename'

export type { OffsetPaginatedOutput } from './pagination.types'

const API_URL = `${API_PREFIX}/movements`

export interface MovementRequest {
  page: number
  pageSize: number
  search?: string
  filters?: ColumnFilter[]
  orders?: SortOrder[]
}

const defaultRequest = (): MovementRequest => ({ page: 1, pageSize: 10 })

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly _http = inject(HttpClient)

  readonly request = signal<MovementRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly movements = resource<OffsetPaginatedOutput<MovementDto>, MovementRequest>({
    params: () => this.request(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<MovementDto>>(API_URL, {
          params: this.buildParams(req)
        })
      )
  })

  create(dto: RegisterMovementDto): Promise<void> {
    return firstValueFrom(this._http.post<void>(API_URL, dto)).then(() => {
      this.movements.reload()
    })
  }

  update(id: string, dto: UpdateMovementDto): Promise<void> {
    return firstValueFrom(this._http.put<void>(`${API_URL}/${id}`, dto)).then(() => {
      this.movements.reload()
    })
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this._http.delete<void>(`${API_URL}/${id}`)).then(() => {
      this.movements.reload()
    })
  }

  // Downloads the full filtered movement set from the backend, matching the current filters and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get(`${API_URL}/export`, { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(
      response.headers.get('Content-Disposition'),
      `movimientos.${format}`
    )
    return { blob, filename }
  }

  private buildParams(req: MovementRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: MovementRequest): Record<string, string> {
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
