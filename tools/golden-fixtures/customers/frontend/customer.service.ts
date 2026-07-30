import { HttpClient } from '@angular/common/http'
import { Injectable, computed, inject, resource, signal } from '@angular/core'
import { ExportFormat, RegisterCustomerDto, UpdateCustomerDto } from '@sap-licenses/shared/domain'
import { CustomerDto } from '@sap-licenses/shared/domain'
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

export interface CustomerRequest {
  page: number
  pageSize: number
  search?: string
  filters?: ColumnFilter[]
  orders?: SortOrder[]
  // spec 32: por defecto la lista solo muestra activos; el toggle lo activa
  includeArchived?: boolean
}

const defaultRequest = (): CustomerRequest => ({ page: 1, pageSize: 10 })

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly _http = inject(HttpClient)

  readonly request = signal<CustomerRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly customers = resource<OffsetPaginatedOutput<CustomerDto>, CustomerRequest>({
    params: () => this.request(),
    loader: ({ params: req }) => {
      const params: Record<string, string> = {
        page: String(req.page),
        pageSize: String(req.pageSize),
        ...this.criteriaParams(req)
      }
      return firstValueFrom(this._http.get<OffsetPaginatedOutput<CustomerDto>>('/api/v1/customers', { params }))
    }
  })

  // Conteo de archivados para el toggle "Incluir archivados" (spec 40): one-shot, sin params → carga una vez.
  private readonly _archivedCount = resource({
    loader: () => firstValueFrom(this._http.get<{ count: number }>('/api/v1/customers/archived-count'))
  })
  readonly archivedCount = computed(() => this._archivedCount.value()?.count ?? 0)

  // Search, filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: CustomerRequest): Record<string, string> {
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
    // Compartido por lista y export: el export refleja la misma vista (con o sin archivados)
    if (req.includeArchived) {
      params['includeArchived'] = 'true'
    }
    return params
  }

  // Downloads the full filtered customer set from the backend, matching the current search and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get('/api/v1/customers/export', { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition'), `clientes.${format}`)
    return { blob, filename }
  }

  create(dto: RegisterCustomerDto): Promise<void> {
    return firstValueFrom(this._http.post<void>('/api/v1/customers', dto)).then(() => {
      this.customers.reload()
    })
  }

  update(id: string, dto: UpdateCustomerDto): Promise<void> {
    return firstValueFrom(this._http.put<void>(`/api/v1/customers/${id}`, dto)).then(() => {
      this.customers.reload()
    })
  }
}
