import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import {
  BillingFrequencyEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTypeEnum,
  RenewalTypeEnum
} from '@sap-licenses/shared/domain'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { ContractService } from './contract.service'
import { MOCK_CONTRACTS_PAGINATED } from './mocks/contract.mock'

const tick = () => TestBed.flushEffects()

describe('ContractService — listado', () => {
  let service: ContractService
  let httpGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpGet = vi.fn().mockReturnValue(of(MOCK_CONTRACTS_PAGINATED))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() } },
        ContractService
      ]
    })
    service = TestBed.inject(ContractService)
  })

  it('initializes request signal with page 1 and pageSize 10', () => {
    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('resetRequest restores the default request', () => {
    service.request.set({ page: 3, pageSize: 50, search: 'acme' })

    service.resetRequest()

    expect(service.request()).toEqual({ page: 1, pageSize: 10 })
  })

  it('calls GET /api/v1/contracts with page and pageSize params on load', () => {
    tick()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/contracts', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('adds an orders param (JSON) when orders are set', () => {
    const orders = [{ orderBy: 'contractNumber', orderType: 'asc' as const }]
    service.request.set({ page: 1, pageSize: 10, orders })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/contracts', {
      params: { page: '1', pageSize: '10', orders: JSON.stringify(orders) }
    })
  })

  it('exposes paginated response after load', async () => {
    tick()
    await Promise.resolve()
    await Promise.resolve()
    expect(service.contracts.value()).toEqual(MOCK_CONTRACTS_PAGINATED)
  })

  it('adds the search param when a term is set, and omits it when empty', () => {
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/contracts', {
      params: { page: '1', pageSize: '10', search: 'acme' }
    })

    service.request.set({ page: 1, pageSize: 10, search: undefined })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/contracts', {
      params: { page: '1', pageSize: '10' }
    })
  })

  it('serializes column filters to the filters param, dropping the columnLabel', () => {
    const filters = [
      { column: 'contractType', columnLabel: 'Tipo', operator: 'eq', value: ContractTypeEnum.CLOUD },
      { column: 'status', columnLabel: 'Estado', operator: 'eq', value: ContractStatusEnum.ACTIVE }
    ]
    service.request.set({ page: 1, pageSize: 10, filters })
    tick()

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/contracts', {
      params: {
        page: '1',
        pageSize: '10',
        filters: JSON.stringify([
          { field: 'contractType', operator: 'eq', value: ContractTypeEnum.CLOUD },
          { field: 'status', operator: 'eq', value: ContractStatusEnum.ACTIVE }
        ])
      }
    })
  })
})

describe('ContractService — mutaciones', () => {
  let service: ContractService
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
            get: vi.fn().mockReturnValue(of(MOCK_CONTRACTS_PAGINATED)),
            post: httpPost,
            put: httpPut,
            delete: httpDelete
          }
        },
        ContractService
      ]
    })
    service = TestBed.inject(ContractService)
  })

  it('create posts to /api/v1/contracts and reloads the list', async () => {
    const reload = vi.spyOn(service.contracts, 'reload')

    await service.create({
      id: '019eb713-19bb-7000-8000-000000000001',
      contractType: ContractTypeEnum.CLOUD,
      contractNumber: 'ContractNumber 2',
      customerId: '019eb713-19bb-7000-8000-000000000002',
      startDate: '2026-04-15'
    })

    expect(httpPost).toHaveBeenCalledOnce()
    expect(reload).toHaveBeenCalledOnce()
  })

  it('update puts to /api/v1/contracts/:id and reloads the list', async () => {
    const reload = vi.spyOn(service.contracts, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.update(id, { isFavorite: true })

    expect(httpPut).toHaveBeenCalledWith(`/api/v1/contracts/${id}`, { isFavorite: true })
    expect(reload).toHaveBeenCalledOnce()
  })

  it('terminate posts to /api/v1/contracts/:id/terminate and reloads the list', async () => {
    const reload = vi.spyOn(service.contracts, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.terminate(id)

    expect(httpPost).toHaveBeenCalledWith(`/api/v1/contracts/${id}/terminate`, {})
    expect(reload).toHaveBeenCalledOnce()
  })

  it('expire posts to /api/v1/contracts/:id/expire and reloads the list', async () => {
    const reload = vi.spyOn(service.contracts, 'reload')
    const id = '019eb713-19bb-7000-8000-000000000010'

    await service.expire(id)

    expect(httpPost).toHaveBeenCalledWith(`/api/v1/contracts/${id}/expire`, {})
    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('ContractService — export', () => {
  let service: ContractService

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
        ContractService
      ]
    })
    service = TestBed.inject(ContractService)
    return { blob, httpGet }
  }

  it('exports as a blob with the current filters and orders, returning the filename from the header', async () => {
    const { blob, httpGet } = configure('attachment; filename="contratos-20260707.csv"')
    service.request.set({
      page: 1,
      pageSize: 10,
      filters: [{ column: 'contractType', columnLabel: 'Tipo', operator: 'eq', value: ContractTypeEnum.CLOUD }],
      orders: [{ orderBy: 'contractNumber', orderType: 'asc' }]
    })

    const result = await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/contracts/export', {
      params: {
        format: 'csv',
        filters: JSON.stringify([{ field: 'contractType', operator: 'eq', value: ContractTypeEnum.CLOUD }]),
        orders: JSON.stringify([{ orderBy: 'contractNumber', orderType: 'asc' }])
      },
      responseType: 'blob',
      observe: 'response'
    })
    expect(result.blob).toBe(blob)
    expect(result.filename).toBe('contratos-20260707.csv')
  })

  it('includes the active search in the export params', async () => {
    const { httpGet } = configure('attachment; filename="contratos-20260707.csv"')
    service.request.set({ page: 1, pageSize: 10, search: 'acme' })

    await service.export('csv')

    expect(httpGet).toHaveBeenLastCalledWith('/api/v1/contracts/export', {
      params: { format: 'csv', search: 'acme' },
      responseType: 'blob',
      observe: 'response'
    })
  })

  it('falls back to a default filename when the header is missing', async () => {
    configure(null)

    const result = await service.export('xlsx')

    expect(result.filename).toBe('contratos.xlsx')
  })
})
