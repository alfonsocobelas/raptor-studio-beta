import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { PropiedadService } from './propiedad.service'
import { MOCK_PROPIEDADS_PAGINATED } from './mocks/propiedad.mock'

const tick = () => TestBed.flushEffects()

describe('PropiedadService — listado', () => {
  let service: PropiedadService
  let httpGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpGet = vi.fn().mockReturnValue(of(MOCK_PROPIEDADS_PAGINATED))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
        PropiedadService
      ]
    })
    service = TestBed.inject(PropiedadService)
  })

  it('initializes request signal with page 1 and pageSize 10', () => {
    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('resetRequest restores the default request', () => {
    service.request.set({ page: 3, pageSize: 50, search: 'acme' })

    service.resetRequest()

    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('calls GET /api/v1/propiedades with page and pageSize params on load', () => {
    tick()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/propiedades', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('adds an orders param (JSON) when orders are set', () => {
    const orders = [{ orderBy: 'titulo', orderType: 'asc' as const }]
    service.request.set({ page: 1, pageSize: 10, orders })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/propiedades', {
      params: { page: '1', pageSize: '10', orders: JSON.stringify(orders) }
    })
  })

  it('exposes paginated response after load', async () => {
    tick()
    await Promise.resolve()
    await Promise.resolve()
    expect(service.propiedades.value()).toEqual(MOCK_PROPIEDADS_PAGINATED)
  })

  it('adds the search param when a term is set, and omits it when empty', () => {
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/propiedades', {
      params: { page: '1', pageSize: '10', search: 'acme' }
    })

    service.request.set({ page: 1, pageSize: 10, search: undefined })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/propiedades', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('serializes column filters to the filters param, dropping the columnLabel', () => {
    const filters = [
      { column: 'titulo', columnLabel: 'Título', operator: 'starts_with', value: 'Titulo 1' },
      { column: 'estado', columnLabel: 'Estado', operator: 'eq', value: 'disponible' }
    ]
    service.request.set({ page: 1, pageSize: 10, filters })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/propiedades', {
      params: {
        page: '1',
        pageSize: '10',
        filters: JSON.stringify([
          { field: 'titulo', operator: 'starts_with', value: 'Titulo 1' },
          { field: 'estado', operator: 'eq', value: 'disponible' }
        ])
      }
    })
  })
})

describe('PropiedadService — mutaciones', () => {
  let service: PropiedadService
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
            get: vi.fn().mockReturnValue(of(MOCK_PROPIEDADS_PAGINATED)),
            post: httpPost,
            put: httpPut,
            delete: httpDelete
          }
        },
        PropiedadService
      ]
    })
    service = TestBed.inject(PropiedadService)
  })

  it('create posts to /api/v1/propiedades and reloads the list', async () => {
    const reload = vi.spyOn(service.propiedades, 'reload')

    await service.create({
      id: '019eb713-19bb-7000-8000-000000000001',
      titulo: 'Titulo 1',
      estado: 'reservada',
      metrosCuadrados: 102,
      habitaciones: 103,
      precio: 104,
      fechaAlta: '2026-06-15',
      exclusiva: false,
      agenteId: '019eb713-19bb-7000-8000-000000000002'
    })

    expect(httpPost).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('update puts to /api/v1/propiedades/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.propiedades, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.update(id, { exclusiva: true })

    expect(httpPut).toHaveBeenCalledWith(`/api/v1/propiedades/${id}`, { exclusiva: true })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('remove deletes /api/v1/propiedades/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.propiedades, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.remove(id)

    expect(httpDelete).toHaveBeenCalledWith(`/api/v1/propiedades/${id}`)
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('PropiedadService — export', () => {
  let service: PropiedadService

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
        PropiedadService
      ]
    })
    service = TestBed.inject(PropiedadService)
    return { blob, httpGet }
  }

  it('exports as a blob with the current filters and orders, returning the filename from the header', async () => {
    const { blob, httpGet } = configure('attachment; filename="propiedades-20260707.csv"')
    service.request.set({
      page: 1,
      pageSize: 10,
      filters: [{ column: 'titulo', columnLabel: 'Título', operator: 'starts_with', value: 'Titulo 1' }],
      orders: [{ orderBy: 'titulo', orderType: 'asc' }]
    })

    const result = await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/propiedades/export', {
      params: {
        format: 'csv',
        filters: JSON.stringify([{ field: 'titulo', operator: 'starts_with', value: 'Titulo 1' }]),
        orders: JSON.stringify([{ orderBy: 'titulo', orderType: 'asc' }])
      },
      responseType: 'blob',
      observe: 'response'
    })
    expect(result.blob).toBe(blob)
    expect(result.filename).toBe('propiedades-20260707.csv')
  })

  it('includes the active search in the export params', async () => {
    const { httpGet } = configure('attachment; filename="propiedades-20260707.csv"')
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })

    await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/propiedades/export', {
      params: { format: 'csv', search: 'acme' },
      responseType: 'blob',
      observe: 'response'
    })
  })

  it('falls back to a default filename when the header is missing', async () => {
    configure(null)

    const result = await service.export('xlsx')

    expect(result.filename).toBe('propiedades.xlsx')
  })
})
