import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { ParametroService } from './parametro.service'
import { MOCK_PARAMETROS_PAGINATED } from './mocks/parametro.mock'

const tick = () => TestBed.flushEffects()

describe('ParametroService — listado', () => {
  let service: ParametroService
  let httpGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpGet = vi.fn().mockReturnValue(of(MOCK_PARAMETROS_PAGINATED))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
        ParametroService
      ]
    })
    service = TestBed.inject(ParametroService)
  })

  it('initializes request signal with page 1 and pageSize 10', () => {
    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('resetRequest restores the default request', () => {
    service.request.set({ page: 3, pageSize: 50, search: 'acme' })

    service.resetRequest()

    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('calls GET /api/v1/parametros with page and pageSize params on load', () => {
    tick()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/parametros', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('adds an orders param (JSON) when orders are set', () => {
    const orders = [{ orderBy: 'codigo', orderType: 'asc' as const }]
    service.request.set({ page: 1, pageSize: 10, orders })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/parametros', {
      params: { page: '1', pageSize: '10', orders: JSON.stringify(orders) }
    })
  })

  it('exposes paginated response after load', async () => {
    tick()
    await Promise.resolve()
    await Promise.resolve()
    expect(service.parametros.value()).toEqual(MOCK_PARAMETROS_PAGINATED)
  })

  it('adds the search param when a term is set, and omits it when empty', () => {
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/parametros', {
      params: { page: '1', pageSize: '10', search: 'acme' }
    })

    service.request.set({ page: 1, pageSize: 10, search: undefined })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/parametros', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('serializes column filters to the filters param, dropping the columnLabel', () => {
    const filters = [{ column: 'codigo', columnLabel: 'Código', operator: 'starts_with', value: 'Codigo 1' }]
    service.request.set({ page: 1, pageSize: 10, filters })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/parametros', {
      params: {
        page: '1',
        pageSize: '10',
        filters: JSON.stringify([{ field: 'codigo', operator: 'starts_with', value: 'Codigo 1' }])
      }
    })
  })
})

describe('ParametroService — mutaciones', () => {
  let service: ParametroService
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
            get: vi.fn().mockReturnValue(of(MOCK_PARAMETROS_PAGINATED)),
            post: httpPost,
            put: httpPut,
            delete: httpDelete
          }
        },
        ParametroService
      ]
    })
    service = TestBed.inject(ParametroService)
  })

  it('create posts to /api/v1/parametros and reloads the list', async () => {
    const reload = vi.spyOn(service.parametros, 'reload')

    await service.create({
      id: '019eb713-19bb-7000-8000-000000000001',
      codigo: 'Codigo 1',
      limiteLegal: 101,
      precio: 102
    })

    expect(httpPost).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('update puts to /api/v1/parametros/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.parametros, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.update(id, { nombre: 'Nombre 1' })

    expect(httpPut).toHaveBeenCalledWith(`/api/v1/parametros/${id}`, { nombre: 'Nombre 1' })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('remove deletes /api/v1/parametros/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.parametros, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.remove(id)

    expect(httpDelete).toHaveBeenCalledWith(`/api/v1/parametros/${id}`)
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('ParametroService — export', () => {
  let service: ParametroService

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
        ParametroService
      ]
    })
    service = TestBed.inject(ParametroService)
    return { blob, httpGet }
  }

  it('exports as a blob with the current filters and orders, returning the filename from the header', async () => {
    const { blob, httpGet } = configure('attachment; filename="parámetros-20260707.csv"')
    service.request.set({
      page: 1,
      pageSize: 10,
      filters: [{ column: 'codigo', columnLabel: 'Código', operator: 'starts_with', value: 'Codigo 1' }],
      orders: [{ orderBy: 'codigo', orderType: 'asc' }]
    })

    const result = await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/parametros/export', {
      params: {
        format: 'csv',
        filters: JSON.stringify([{ field: 'codigo', operator: 'starts_with', value: 'Codigo 1' }]),
        orders: JSON.stringify([{ orderBy: 'codigo', orderType: 'asc' }])
      },
      responseType: 'blob',
      observe: 'response'
    })
    expect(result.blob).toBe(blob)
    expect(result.filename).toBe('parámetros-20260707.csv')
  })

  it('includes the active search in the export params', async () => {
    const { httpGet } = configure('attachment; filename="parámetros-20260707.csv"')
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })

    await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/parametros/export', {
      params: { format: 'csv', search: 'acme' },
      responseType: 'blob',
      observe: 'response'
    })
  })

  it('falls back to a default filename when the header is missing', async () => {
    configure(null)

    const result = await service.export('xlsx')

    expect(result.filename).toBe('parámetros.xlsx')
  })
})
