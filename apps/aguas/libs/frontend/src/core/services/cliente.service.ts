import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import { ClienteDto, ExportFormat, RegisterClienteDto, UpdateClienteDto } from '@app/shared/domain'
import { firstValueFrom } from 'rxjs'
import { ColumnFilter, SortOrder } from '../../shared/components/data-table'
import { API_PREFIX } from '../http/api.constants'
import { OffsetPaginatedOutput } from './pagination.types'
import { parseContentDispositionFilename } from './export-filename'

export type { OffsetPaginatedOutput } from './pagination.types'

const API_URL = `${API_PREFIX}/clientes`

export interface ClienteRequest {
  page: number
  pageSize: number
  search?: string
  filters?: ColumnFilter[]
  orders?: SortOrder[]
}

const defaultRequest = (): ClienteRequest => ({ page: 1, pageSize: 10 })

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly _http = inject(HttpClient)

  readonly request = signal<ClienteRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly clientes = resource<OffsetPaginatedOutput<ClienteDto>, ClienteRequest>({
    params: () => this.request(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<ClienteDto>>(API_URL, {
          params: this.buildParams(req)
        })
      )
  })

  create(dto: RegisterClienteDto): Promise<void> {
    return firstValueFrom(this._http.post<void>(API_URL, dto)).then(() => {
      this.clientes.reload()
    })
  }

  update(id: string, dto: UpdateClienteDto): Promise<void> {
    return firstValueFrom(this._http.put<void>(`${API_URL}/${id}`, dto)).then(() => {
      this.clientes.reload()
    })
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this._http.delete<void>(`${API_URL}/${id}`)).then(() => {
      this.clientes.reload()
    })
  }

  // La papelera (spec 29): el mismo listado, sobre lo soft-borrado.
  readonly trashRequest = signal<ClienteRequest>(defaultRequest())

  resetTrashRequest(): void {
    this.trashRequest.set(defaultRequest())
  }

  readonly deleted = resource<OffsetPaginatedOutput<ClienteDto>, ClienteRequest>({
    params: () => this.trashRequest(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<ClienteDto>>(`${API_URL}/deleted`, {
          params: this.buildParams(req)
        })
      )
  })

  restore(id: string): Promise<void> {
    return firstValueFrom(this._http.post<void>(`${API_URL}/${id}/restore`, {})).then(() => {
      this.clientes.reload()
      this.deleted.reload()
    })
  }

  // Downloads the full filtered cliente set from the backend, matching the current filters and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get(`${API_URL}/export`, { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition'), `clientes.${format}`)
    return { blob, filename }
  }

  private buildParams(req: ClienteRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: ClienteRequest): Record<string, string> {
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
