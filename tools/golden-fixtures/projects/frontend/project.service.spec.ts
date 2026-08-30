import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ProjectImplementerEnum, ProjectStatusEnum } from '@sap-licenses/shared/domain'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { ProjectService } from './project.service'
import { MOCK_PROJECTS_PAGINATED } from './mocks/project.mock'

const tick = () => TestBed.flushEffects()

describe('ProjectService — listado', () => {
  let service: ProjectService
  let httpGet: ReturnType<typeof vi.fn>

  // otras vistas pueden pedir en el mismo tick, así que la última llamada global no
  // siempre es la del listado: se mira la última hecha a SU url
  const lastListCall = () => httpGet.mock.calls.filter(([url]) => url === '/api/v1/projects').at(-1)

  beforeEach(() => {
    httpGet = vi.fn().mockReturnValue(of(MOCK_PROJECTS_PAGINATED))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
        ProjectService
      ]
    })
    service = TestBed.inject(ProjectService)
  })

  it('initializes request signal with page 1 and pageSize 10', () => {
    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('resetRequest restores the default request', () => {
    service.request.set({ page: 3, pageSize: 50, search: 'acme' })

    service.resetRequest()

    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('calls GET /api/v1/projects with page and pageSize params on load', () => {
    tick()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/projects', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('adds an orders param (JSON) when orders are set', () => {
    const orders = [{ orderBy: 'name', orderType: 'asc' as const }]
    service.request.set({ page: 1, pageSize: 10, orders })
    tick()

    expect(lastListCall()).toEqual([
      '/api/v1/projects',
      { params: { page: '1', pageSize: '10', orders: JSON.stringify(orders) } }
    ])
  })

  it('exposes paginated response after load', async () => {
    tick()
    await Promise.resolve()
    await Promise.resolve()
    expect(service.projects.value()).toEqual(MOCK_PROJECTS_PAGINATED)
  })

  it('adds the search param when a term is set, and omits it when empty', () => {
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })
    tick()

    expect(lastListCall()).toEqual(['/api/v1/projects', { params: { page: '1', pageSize: '10', search: 'acme' } }])

    service.request.set({ page: 1, pageSize: 10, search: undefined })
    tick()

    expect(lastListCall()).toEqual(['/api/v1/projects', { params: { page: '1', pageSize: '10' } }])
  })

  it('serializes column filters to the filters param, dropping the columnLabel', () => {
    const filters = [
      { column: 'status', columnLabel: 'Estado', operator: 'eq', value: ProjectStatusEnum.PLANNING },
      { column: 'implementer', columnLabel: 'Implementador', operator: 'eq', value: ProjectImplementerEnum.AVVALE }
    ]
    service.request.set({ page: 1, pageSize: 10, filters })
    tick()

    expect(lastListCall()).toEqual([
      '/api/v1/projects',
      {
        params: {
          page: '1',
          pageSize: '10',
          filters: JSON.stringify([
            { field: 'status', operator: 'eq', value: ProjectStatusEnum.PLANNING },
            { field: 'implementer', operator: 'eq', value: ProjectImplementerEnum.AVVALE }
          ])
        }
      }
    ])
  })
})

describe('ProjectService — mutaciones', () => {
  let service: ProjectService
  let httpPost: ReturnType<typeof vi.fn>
  let httpPut: ReturnType<typeof vi.fn>
  let httpDelete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpPost = vi.fn().mockReturnValue(of(undefined))
    httpPut = vi.fn().mockReturnValue(of(undefined))
    httpDelete = vi.fn().mockReturnValue(of(undefined))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: HttpClient,
          useValue: {
            get: vi.fn().mockReturnValue(of(MOCK_PROJECTS_PAGINATED)),
            post: httpPost,
            put: httpPut,
            delete: httpDelete
          }
        },
        ProjectService
      ]
    })
    service = TestBed.inject(ProjectService)
  })

  it('create posts to /api/v1/projects and reloads the list', async () => {
    const reload = vi.spyOn(service.projects, 'reload')

    await service.create({
      id: '019eb713-19bb-7000-8000-000000000001',
      customerId: '019eb713-19bb-7000-8000-000000000002',
      name: 'Name 2',
      startDate: '2026-03-15'
    })

    expect(httpPost).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('update puts to /api/v1/projects/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.projects, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.update(id, { version: 1 })

    expect(httpPut).toHaveBeenCalledWith(`/api/v1/projects/${id}`, { version: 1 })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('remove deletes /api/v1/projects/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.projects, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.remove(id)

    expect(httpDelete).toHaveBeenCalledWith(`/api/v1/projects/${id}`)
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('ProjectService — export', () => {
  let service: ProjectService

  const configure = (disposition: string | null) => {
    const blob = new Blob(['data'], { type: 'text/csv' })
    const httpGet = vi
      .fn()
      .mockReturnValue(
        of({ body: blob, headers: { get: (name: string) => (name === 'Content-Disposition' ? disposition : null) } })
      )
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
        ProjectService
      ]
    })
    service = TestBed.inject(ProjectService)
    return { blob, httpGet }
  }

  it('exports as a blob with the current filters and orders, returning the filename from the header', async () => {
    const { blob, httpGet } = configure('attachment; filename="proyectos-20260707.csv"')
    service.request.set({
      page: 1,
      pageSize: 10,
      filters: [{ column: 'status', columnLabel: 'Estado', operator: 'eq', value: ProjectStatusEnum.PLANNING }],
      orders: [{ orderBy: 'name', orderType: 'asc' }]
    })

    const result = await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/projects/export', {
      params: {
        format: 'csv',
        filters: JSON.stringify([{ field: 'status', operator: 'eq', value: ProjectStatusEnum.PLANNING }]),
        orders: JSON.stringify([{ orderBy: 'name', orderType: 'asc' }])
      },
      responseType: 'blob',
      observe: 'response'
    })
    expect(result.blob).toBe(blob)
    expect(result.filename).toBe('proyectos-20260707.csv')
  })

  it('includes the active search in the export params', async () => {
    const { httpGet } = configure('attachment; filename="proyectos-20260707.csv"')
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })

    await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/projects/export', {
      params: { format: 'csv', search: 'acme' },
      responseType: 'blob',
      observe: 'response'
    })
  })

  it('falls back to a default filename when the header is missing', async () => {
    configure(null)

    const result = await service.export('xlsx')

    expect(result.filename).toBe('proyectos.xlsx')
  })
})
