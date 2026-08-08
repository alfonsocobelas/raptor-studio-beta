import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { VisitaService } from './visita.service'
import { MOCK_VISITAS_PAGINATED } from './mocks/visita.mock'

const tick = () => TestBed.flushEffects()

describe('VisitaService — listado', () => {
  let service: VisitaService
  let httpGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpGet = vi.fn().mockReturnValue(of(MOCK_VISITAS_PAGINATED))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
        VisitaService
      ]
    })
    service = TestBed.inject(VisitaService)
  })

  it('initializes request signal with page 1 and pageSize 10', () => {
    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('resetRequest restores the default request', () => {
    service.request.set({ page: 3, pageSize: 50, search: 'acme' })

    service.resetRequest()

    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('calls GET /api/v1/visitas with page and pageSize params on load', () => {
    tick()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/visitas', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('adds an orders param (JSON) when orders are set', () => {
    const orders = [{ orderBy: 'referencia', orderType: 'asc' as const }]
    service.request.set({ page: 1, pageSize: 10, orders })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/visitas', {
      params: { page: '1', pageSize: '10', orders: JSON.stringify(orders) }
    })
  })

  it('exposes paginated response after load', async () => {
    tick()
    await Promise.resolve()
    await Promise.resolve()
    expect(service.visitas.value()).toEqual(MOCK_VISITAS_PAGINATED)
  })

  it('adds the search param when a term is set, and omits it when empty', () => {
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/visitas', {
      params: { page: '1', pageSize: '10', search: 'acme' }
    })

    service.request.set({ page: 1, pageSize: 10, search: undefined })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/visitas', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('serializes column filters to the filters param, dropping the columnLabel', () => {
    const filters = [
      { column: 'referencia', columnLabel: 'Referencia', operator: 'starts_with', value: 'Referencia 1' },
      {
        column: 'propiedadId',
        columnLabel: 'Propiedad',
        operator: 'starts_with',
        value: '019eb713-19bb-7000-8000-000000000002'
      }
    ]
    service.request.set({ page: 1, pageSize: 10, filters })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/visitas', {
      params: {
        page: '1',
        pageSize: '10',
        filters: JSON.stringify([
          { field: 'referencia', operator: 'starts_with', value: 'Referencia 1' },
          { field: 'propiedadId', operator: 'starts_with', value: '019eb713-19bb-7000-8000-000000000002' }
        ])
      }
    })
  })
})

describe('VisitaService — mutaciones', () => {
  let service: VisitaService
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
            get: vi.fn().mockReturnValue(of(MOCK_VISITAS_PAGINATED)),
            post: httpPost,
            put: httpPut,
            delete: httpDelete
          }
        },
        VisitaService
      ]
    })
    service = TestBed.inject(VisitaService)
  })

  it('create posts to /api/v1/visitas and reloads the list', async () => {
    const reload = vi.spyOn(service.visitas, 'reload')

    await service.create({
      id: '019eb713-19bb-7000-8000-000000000001',
      referencia: 'Referencia 1',
      fecha: '2026-02-15',
      confirmada: false,
      propiedadId: '019eb713-19bb-7000-8000-000000000002'
    })

    expect(httpPost).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('update puts to /api/v1/visitas/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.visitas, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.update(id, { confirmada: true })

    expect(httpPut).toHaveBeenCalledWith(`/api/v1/visitas/${id}`, { confirmada: true })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('remove deletes /api/v1/visitas/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.visitas, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.remove(id)

    expect(httpDelete).toHaveBeenCalledWith(`/api/v1/visitas/${id}`)
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('VisitaService — export', () => {
  let service: VisitaService

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
        VisitaService
      ]
    })
    service = TestBed.inject(VisitaService)
    return { blob, httpGet }
  }

  it('exports as a blob with the current filters and orders, returning the filename from the header', async () => {
    const { blob, httpGet } = configure('attachment; filename="visitas-20260707.csv"')
    service.request.set({
      page: 1,
      pageSize: 10,
      filters: [{ column: 'referencia', columnLabel: 'Referencia', operator: 'starts_with', value: 'Referencia 1' }],
      orders: [{ orderBy: 'referencia', orderType: 'asc' }]
    })

    const result = await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/visitas/export', {
      params: {
        format: 'csv',
        filters: JSON.stringify([{ field: 'referencia', operator: 'starts_with', value: 'Referencia 1' }]),
        orders: JSON.stringify([{ orderBy: 'referencia', orderType: 'asc' }])
      },
      responseType: 'blob',
      observe: 'response'
    })
    expect(result.blob).toBe(blob)
    expect(result.filename).toBe('visitas-20260707.csv')
  })

  it('includes the active search in the export params', async () => {
    const { httpGet } = configure('attachment; filename="visitas-20260707.csv"')
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })

    await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/visitas/export', {
      params: { format: 'csv', search: 'acme' },
      responseType: 'blob',
      observe: 'response'
    })
  })

  it('falls back to a default filename when the header is missing', async () => {
    configure(null)

    const result = await service.export('xlsx')

    expect(result.filename).toBe('visitas.xlsx')
  })
})
