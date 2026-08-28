import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { DashboardService } from './dashboard.service'

/** Total devuelto por cada endpoint, distinto por recurso para detectar cruces. */
const TOTALS: Record<string, number> = {
  '/api/v1/contracts': 7,
  '/api/v1/projects': 14
}

describe('DashboardService — totales por recurso', () => {
  let service: DashboardService
  let httpGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpGet = vi.fn().mockImplementation((url: string) => of({ total: TOTALS[url] ?? 0 }))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet } },
        DashboardService
      ]
    })
    service = TestBed.inject(DashboardService)
  })

  const load = async () => {
    TestBed.flushEffects()
    await Promise.resolve()
    await Promise.resolve()
  }

  it('asks each resource for a single row (only the total matters)', async () => {
    await load()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/contracts', { params: { page: '1', pageSize: '1' } })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/projects', { params: { page: '1', pageSize: '1' } })
  })

  it('exposes zero totals while there is no data', () => {
    expect(service.contractsTotal()).toBe(0)
    expect(service.projectsTotal()).toBe(0)
  })

  it('exposes the total of every resource once loaded', async () => {
    await load()
    expect(service.contractsTotal()).toBe(7)
    expect(service.projectsTotal()).toBe(14)
  })

  it('spends exactly the requests the panel needs, and no more', async () => {
    await load()

    expect(httpGet).toHaveBeenCalledTimes(17)
    expect(httpGet).toHaveBeenCalledWith('/api/v1/projects', {
      params: {
        page: '1',
        pageSize: '1',
        filters: JSON.stringify([{ field: 'status', operator: 'eq', value: 'planning' }])
      }
    })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/contracts', {
      params: expect.objectContaining({ page: '1', pageSize: '1', filters: expect.any(String) })
    })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/projects', {
      params: {
        page: '1',
        pageSize: '1',
        filters: JSON.stringify([{ field: 'status', operator: 'eq', value: 'closed' }])
      }
    })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/contracts', { params: { page: '1', pageSize: '1' } })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/contracts/aggregate', {
      params: { page: '1', pageSize: '1', op: 'sum', field: 'totalValue' }
    })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/contracts/aggregate', {
      params: {
        page: '1',
        pageSize: '1',
        op: 'avg',
        field: 'totalValue',
        filters: JSON.stringify([{ field: 'contractType', operator: 'eq', value: 'cloud' }])
      }
    })
  })
})
