import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { SupplierService } from './supplier.service'
import { MOCK_SUPPLIERS_PAGINATED } from './mocks/supplier.mock'

const tick = () => TestBed.flushEffects()

describe('SupplierService — listado', () => {
  let service: SupplierService
  let httpGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpGet = vi.fn().mockReturnValue(of(MOCK_SUPPLIERS_PAGINATED))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
        SupplierService
      ]
    })
    service = TestBed.inject(SupplierService)
  })

  it('initializes request signal with page 1 and pageSize 10', () => {
    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('resetRequest restores the default request', () => {
    service.request.set({ page: 3, pageSize: 50, search: 'acme' })

    service.resetRequest()

    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('calls GET /api/v1/suppliers with page and pageSize params on load', () => {
    tick()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/suppliers', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('adds an orders param (JSON) when orders are set', () => {
    const orders = [{ orderBy: 'name', orderType: 'asc' as const }]
    service.request.set({ page: 1, pageSize: 10, orders })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/suppliers', {
      params: { page: '1', pageSize: '10', orders: JSON.stringify(orders) }
    })
  })

  it('exposes paginated response after load', async () => {
    tick()
    await Promise.resolve()
    await Promise.resolve()
    expect(service.suppliers.value()).toEqual(MOCK_SUPPLIERS_PAGINATED)
  })

  it('adds the search param when a term is set, and omits it when empty', () => {
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/suppliers', {
      params: { page: '1', pageSize: '10', search: 'acme' }
    })

    service.request.set({ page: 1, pageSize: 10, search: undefined })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/suppliers', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('serializes column filters to the filters param, dropping the columnLabel', () => {
    const filters = [
      { column: 'name', columnLabel: 'Proveedor', operator: 'starts_with', value: 'Name 1' },
      { column: 'taxId', columnLabel: 'CIF', operator: 'starts_with', value: 'TaxId 1' }
    ]
    service.request.set({ page: 1, pageSize: 10, filters })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/suppliers', {
      params: {
        page: '1',
        pageSize: '10',
        filters: JSON.stringify([
          { field: 'name', operator: 'starts_with', value: 'Name 1' },
          { field: 'taxId', operator: 'starts_with', value: 'TaxId 1' }
        ])
      }
    })
  })
})

describe('SupplierService — mutaciones', () => {
  let service: SupplierService
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
            get: vi.fn().mockReturnValue(of(MOCK_SUPPLIERS_PAGINATED)),
            post: httpPost,
            put: httpPut,
            delete: httpDelete
          }
        },
        SupplierService
      ]
    })
    service = TestBed.inject(SupplierService)
  })

  it('create posts to /api/v1/suppliers and reloads the list', async () => {
    const reload = vi.spyOn(service.suppliers, 'reload')

    await service.create({
      id: '019eb713-19bb-7000-8000-000000000001',
      name: 'Name 1',
      leadTimeDays: 101
    })

    expect(httpPost).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('update puts to /api/v1/suppliers/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.suppliers, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.update(id, { taxId: 'TaxId 1' })

    expect(httpPut).toHaveBeenCalledWith(`/api/v1/suppliers/${id}`, { taxId: 'TaxId 1' })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('remove deletes /api/v1/suppliers/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.suppliers, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.remove(id)

    expect(httpDelete).toHaveBeenCalledWith(`/api/v1/suppliers/${id}`)
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('SupplierService — export', () => {
  let service: SupplierService

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
        SupplierService
      ]
    })
    service = TestBed.inject(SupplierService)
    return { blob, httpGet }
  }

  it('exports as a blob with the current filters and orders, returning the filename from the header', async () => {
    const { blob, httpGet } = configure('attachment; filename="proveedores-20260707.csv"')
    service.request.set({
      page: 1,
      pageSize: 10,
      filters: [{ column: 'name', columnLabel: 'Proveedor', operator: 'starts_with', value: 'Name 1' }],
      orders: [{ orderBy: 'name', orderType: 'asc' }]
    })

    const result = await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/suppliers/export', {
      params: {
        format: 'csv',
        filters: JSON.stringify([{ field: 'name', operator: 'starts_with', value: 'Name 1' }]),
        orders: JSON.stringify([{ orderBy: 'name', orderType: 'asc' }])
      },
      responseType: 'blob',
      observe: 'response'
    })
    expect(result.blob).toBe(blob)
    expect(result.filename).toBe('proveedores-20260707.csv')
  })

  it('includes the active search in the export params', async () => {
    const { httpGet } = configure('attachment; filename="proveedores-20260707.csv"')
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })

    await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/suppliers/export', {
      params: { format: 'csv', search: 'acme' },
      responseType: 'blob',
      observe: 'response'
    })
  })

  it('falls back to a default filename when the header is missing', async () => {
    configure(null)

    const result = await service.export('xlsx')

    expect(result.filename).toBe('proveedores.xlsx')
  })
})
