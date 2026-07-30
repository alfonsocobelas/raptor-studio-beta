import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import { CustomerDto, ExportFormat, RegisterCustomerDto, UpdateCustomerDto } from '@sap-licenses/shared/domain'
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
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<CustomerDto>>('/api/v1/customers', {
          params: this.buildParams(req)
        })
      )
  })

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

  // Downloads the full filtered customer set from the backend, matching the current filters and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get('/api/v1/customers/export', { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition'), `clientes.${format}`)
    return { blob, filename }
  }

  private buildParams(req: CustomerRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: CustomerRequest): Record<string, string> {
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
}
