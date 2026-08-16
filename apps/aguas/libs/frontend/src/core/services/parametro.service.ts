import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import { ExportFormat, ParametroDto, RegisterParametroDto, UpdateParametroDto } from '@app/shared/domain'
import { firstValueFrom } from 'rxjs'
import { ColumnFilter, SortOrder } from '../../shared/components/data-table'
import { API_PREFIX } from '../http/api.constants'
import { OffsetPaginatedOutput } from './pagination.types'
import { parseContentDispositionFilename } from './export-filename'

export type { OffsetPaginatedOutput } from './pagination.types'

const API_URL = `${API_PREFIX}/parametros`

export interface ParametroRequest {
  page: number
  pageSize: number
  search?: string
  filters?: ColumnFilter[]
  orders?: SortOrder[]
}

const defaultRequest = (): ParametroRequest => ({ page: 1, pageSize: 10 })

@Injectable({ providedIn: 'root' })
export class ParametroService {
  private readonly _http = inject(HttpClient)

  readonly request = signal<ParametroRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly parametros = resource<OffsetPaginatedOutput<ParametroDto>, ParametroRequest>({
    params: () => this.request(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<ParametroDto>>(API_URL, {
          params: this.buildParams(req)
        })
      )
  })

  create(dto: RegisterParametroDto): Promise<void> {
    return firstValueFrom(this._http.post<void>(API_URL, dto)).then(() => {
      this.parametros.reload()
    })
  }

  update(id: string, dto: UpdateParametroDto): Promise<void> {
    return firstValueFrom(this._http.put<void>(`${API_URL}/${id}`, dto)).then(() => {
      this.parametros.reload()
    })
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this._http.delete<void>(`${API_URL}/${id}`)).then(() => {
      this.parametros.reload()
    })
  }

  // La papelera (spec 29): el mismo listado, sobre lo soft-borrado.
  readonly trashRequest = signal<ParametroRequest>(defaultRequest())

  resetTrashRequest(): void {
    this.trashRequest.set(defaultRequest())
  }

  readonly deleted = resource<OffsetPaginatedOutput<ParametroDto>, ParametroRequest>({
    params: () => this.trashRequest(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<ParametroDto>>(`${API_URL}/deleted`, {
          params: this.buildParams(req)
        })
      )
  })

  restore(id: string): Promise<void> {
    return firstValueFrom(this._http.post<void>(`${API_URL}/${id}/restore`, {})).then(() => {
      this.parametros.reload()
      this.deleted.reload()
    })
  }

  // Downloads the full filtered parametro set from the backend, matching the current filters and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get(`${API_URL}/export`, { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(
      response.headers.get('Content-Disposition'),
      `parámetros.${format}`
    )
    return { blob, filename }
  }

  private buildParams(req: ParametroRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: ParametroRequest): Record<string, string> {
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
