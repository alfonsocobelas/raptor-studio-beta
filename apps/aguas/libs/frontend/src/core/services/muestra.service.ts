import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import { ExportFormat, MuestraDto, RegisterMuestraDto, UpdateMuestraDto } from '@app/shared/domain'
import { firstValueFrom } from 'rxjs'
import { ColumnFilter, SortOrder } from '../../shared/components/data-table'
import { API_PREFIX } from '../http/api.constants'
import { OffsetPaginatedOutput } from './pagination.types'
import { parseContentDispositionFilename } from './export-filename'

export type { OffsetPaginatedOutput } from './pagination.types'

const API_URL = `${API_PREFIX}/muestras`

export interface MuestraRequest {
  page: number
  pageSize: number
  search?: string
  filters?: ColumnFilter[]
  orders?: SortOrder[]
}

const defaultRequest = (): MuestraRequest => ({ page: 1, pageSize: 10 })

@Injectable({ providedIn: 'root' })
export class MuestraService {
  private readonly _http = inject(HttpClient)

  readonly request = signal<MuestraRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly muestras = resource<OffsetPaginatedOutput<MuestraDto>, MuestraRequest>({
    params: () => this.request(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<MuestraDto>>(API_URL, {
          params: this.buildParams(req)
        })
      )
  })

  /** Carga un registro por id: lo que necesita la ficha (spec 16). */
  findOne(id: string): Promise<MuestraDto> {
    return firstValueFrom(this._http.get<MuestraDto>(`${API_URL}/${id}`))
  }

  create(dto: RegisterMuestraDto): Promise<void> {
    return firstValueFrom(this._http.post<void>(API_URL, dto)).then(() => {
      this.muestras.reload()
    })
  }

  update(id: string, dto: UpdateMuestraDto): Promise<void> {
    return firstValueFrom(this._http.put<void>(`${API_URL}/${id}`, dto)).then(() => {
      this.muestras.reload()
    })
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this._http.delete<void>(`${API_URL}/${id}`)).then(() => {
      this.muestras.reload()
    })
  }

  // La papelera (spec 29): el mismo listado, sobre lo soft-borrado.
  readonly trashRequest = signal<MuestraRequest>(defaultRequest())

  resetTrashRequest(): void {
    this.trashRequest.set(defaultRequest())
  }

  readonly deleted = resource<OffsetPaginatedOutput<MuestraDto>, MuestraRequest>({
    params: () => this.trashRequest(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<MuestraDto>>(`${API_URL}/deleted`, {
          params: this.buildParams(req)
        })
      )
  })

  restore(id: string): Promise<void> {
    return firstValueFrom(this._http.post<void>(`${API_URL}/${id}/restore`, {})).then(() => {
      this.muestras.reload()
      this.deleted.reload()
    })
  }

  // Downloads the full filtered muestra set from the backend, matching the current filters and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get(`${API_URL}/export`, { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition'), `muestras.${format}`)
    return { blob, filename }
  }

  private buildParams(req: MuestraRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: MuestraRequest): Record<string, string> {
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
