import { HttpClient } from '@angular/common/http'
import { Injectable, inject, resource, signal } from '@angular/core'
import {
  AuditEventDto,
  ExportFormat,
  ProjectDto,
  RegisterProjectDto,
  UpdateProjectDto
} from '@sap-licenses/shared/domain'
import { firstValueFrom } from 'rxjs'
import { ColumnFilter, SortOrder } from '../../shared/components/data-table'
import { API_PREFIX } from '../http/api.constants'
import { OffsetPaginatedOutput } from './pagination.types'
import { parseContentDispositionFilename } from './export-filename'

export type { OffsetPaginatedOutput } from './pagination.types'

const API_URL = `${API_PREFIX}/projects`

export interface ProjectRequest {
  page: number
  pageSize: number
  search?: string
  filters?: ColumnFilter[]
  orders?: SortOrder[]
}

const defaultRequest = (): ProjectRequest => ({ page: 1, pageSize: 10 })

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly _http = inject(HttpClient)

  readonly request = signal<ProjectRequest>(defaultRequest())

  resetRequest(): void {
    this.request.set(defaultRequest())
  }

  readonly projects = resource<OffsetPaginatedOutput<ProjectDto>, ProjectRequest>({
    params: () => this.request(),
    loader: ({ params: req }) =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<ProjectDto>>(API_URL, {
          params: this.buildParams(req)
        })
      )
  })

  /** Carga un registro por id: la ficha (spec 16) y la etiqueta del lookup al editar (spec 66). */
  findOne(id: string): Promise<ProjectDto> {
    return firstValueFrom(this._http.get<ProjectDto>(`${API_URL}/${id}`))
  }

  /** Typeahead de referencias (spec 66): búsqueda propia y paginada, SIN tocar el request compartido. */
  lookup(search: string, page = 1): Promise<{ items: ProjectDto[]; hasMore: boolean }> {
    return firstValueFrom(
      this._http.get<OffsetPaginatedOutput<ProjectDto>>(API_URL, {
        params: this.buildParams({ page, pageSize: 20, ...(search ? { search } : {}) })
      })
    ).then(result => ({ items: result.items, hasMore: page * 20 < result.total }))
  }

  /** La timeline de la ficha (spec 31): los últimos eventos del registro. */
  history(id: string): Promise<AuditEventDto[]> {
    return firstValueFrom(this._http.get<AuditEventDto[]>(`${API_URL}/${id}/history`))
  }

  create(dto: RegisterProjectDto): Promise<void> {
    return firstValueFrom(this._http.post<void>(API_URL, dto)).then(() => {
      this.projects.reload()
    })
  }

  update(id: string, dto: UpdateProjectDto): Promise<void> {
    return firstValueFrom(this._http.put<void>(`${API_URL}/${id}`, dto)).then(() => {
      this.projects.reload()
    })
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this._http.delete<void>(`${API_URL}/${id}`)).then(() => {
      this.projects.reload()
    })
  }

  // Downloads the full filtered project set from the backend, matching the current filters and order.
  async export(format: ExportFormat): Promise<{ blob: Blob; filename: string }> {
    const params: Record<string, string> = { format, ...this.criteriaParams(this.request()) }

    const response = await firstValueFrom(
      this._http.get(`${API_URL}/export`, { params, responseType: 'blob', observe: 'response' })
    )

    const blob = response.body as Blob
    const filename = parseContentDispositionFilename(response.headers.get('Content-Disposition'), `proyectos.${format}`)
    return { blob, filename }
  }

  private buildParams(req: ProjectRequest): Record<string, string> {
    return {
      page: String(req.page),
      pageSize: String(req.pageSize),
      ...this.criteriaParams(req)
    }
  }

  // Filters and orders shared by the list query and the export (everything except pagination).
  private criteriaParams(req: ProjectRequest): Record<string, string> {
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
