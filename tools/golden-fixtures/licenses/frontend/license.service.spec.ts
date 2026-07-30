import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { LicenseService } from './license.service'
import { MOCK_LICENSES_PAGINATED } from './mocks/license.mock'

const tick = () => TestBed.flushEffects()

describe('LicenseService — listado', () => {
  let service: LicenseService
  let httpGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpGet = vi.fn().mockReturnValue(of(MOCK_LICENSES_PAGINATED))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
        LicenseService
      ]
    })
    service = TestBed.inject(LicenseService)
  })

  it('initializes request signal with page 1 and pageSize 10', () => {
    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('resetRequest restores the default request', () => {
    service.request.set({ page: 3, pageSize: 50, search: 'acme' })

    service.resetRequest()

    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('calls GET /api/v1/licenses with page and pageSize params on load', () => {
    tick()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/licenses', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('adds an orders param (JSON) when orders are set', () => {
    const orders = [{ orderBy: 'customerName', orderType: 'asc' as const }]
    service.request.set({ page: 1, pageSize: 10, orders })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/licenses', {
      params: { page: '1', pageSize: '10', orders: JSON.stringify(orders) }
    })
  })

  it('exposes paginated response after load', async () => {
    tick()
    await Promise.resolve()
    await Promise.resolve()
    expect(service.licenses.value()).toEqual(MOCK_LICENSES_PAGINATED)
  })

  it('adds the search param when a term is set, and omits it when empty', () => {
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/licenses', {
      params: { page: '1', pageSize: '10', search: 'acme' }
    })

    service.request.set({ page: 1, pageSize: 10, search: undefined })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/licenses', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('serializes column filters to the filters param, dropping the columnLabel', () => {
    const filters = [
      {
        column: 'contractId',
        columnLabel: 'contractId',
        operator: 'starts_with',
        value: '019eb713-19bb-7000-8000-000000000002'
      },
      {
        column: 'customerId',
        columnLabel: 'customerId',
        operator: 'starts_with',
        value: '019eb713-19bb-7000-8000-000000000002'
      }
    ]
    service.request.set({ page: 1, pageSize: 10, filters })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/licenses', {
      params: {
        page: '1',
        pageSize: '10',
        filters: JSON.stringify([
          { field: 'contractId', operator: 'starts_with', value: '019eb713-19bb-7000-8000-000000000002' },
          { field: 'customerId', operator: 'starts_with', value: '019eb713-19bb-7000-8000-000000000002' }
        ])
      }
    })
  })
})

describe('LicenseService — export', () => {
  let service: LicenseService

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
        LicenseService
      ]
    })
    service = TestBed.inject(LicenseService)
    return { blob, httpGet }
  }

  it('exports as a blob with the current filters and orders, returning the filename from the header', async () => {
    const { blob, httpGet } = configure('attachment; filename="licencias-20260707.csv"')
    service.request.set({
      page: 1,
      pageSize: 10,
      filters: [
        {
          column: 'contractId',
          columnLabel: 'contractId',
          operator: 'starts_with',
          value: '019eb713-19bb-7000-8000-000000000002'
        }
      ],
      orders: [{ orderBy: 'customerName', orderType: 'asc' }]
    })

    const result = await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/licenses/export', {
      params: {
        format: 'csv',
        filters: JSON.stringify([
          { field: 'contractId', operator: 'starts_with', value: '019eb713-19bb-7000-8000-000000000002' }
        ]),
        orders: JSON.stringify([{ orderBy: 'customerName', orderType: 'asc' }])
      },
      responseType: 'blob',
      observe: 'response'
    })
    expect(result.blob).toBe(blob)
    expect(result.filename).toBe('licencias-20260707.csv')
  })

  it('includes the active search in the export params', async () => {
    const { httpGet } = configure('attachment; filename="licencias-20260707.csv"')
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })

    await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/licenses/export', {
      params: { format: 'csv', search: 'acme' },
      responseType: 'blob',
      observe: 'response'
    })
  })

  it('falls back to a default filename when the header is missing', async () => {
    configure(null)

    const result = await service.export('xlsx')

    expect(result.filename).toBe('licencias.xlsx')
  })
})
