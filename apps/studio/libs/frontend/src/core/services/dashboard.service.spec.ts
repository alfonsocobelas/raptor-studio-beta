import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { DashboardService } from './dashboard.service'

/** Total devuelto por cada endpoint, distinto por recurso para detectar cruces. */
const TOTALS: Record<string, number> = {
  '/api/v1/garments': 7,
  '/api/v1/suppliers': 14,
  '/api/v1/movements': 21
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
    expect(httpGet).toHaveBeenCalledWith('/api/v1/garments', { params: { page: '1', pageSize: '1' } })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/suppliers', { params: { page: '1', pageSize: '1' } })
    expect(httpGet).toHaveBeenCalledWith('/api/v1/movements', { params: { page: '1', pageSize: '1' } })
  })

  it('exposes zero totals while there is no data', () => {
    expect(service.garmentsTotal()).toBe(0)
    expect(service.suppliersTotal()).toBe(0)
    expect(service.movementsTotal()).toBe(0)
  })

  it('exposes the total of every resource once loaded', async () => {
    await load()
    expect(service.garmentsTotal()).toBe(7)
    expect(service.suppliersTotal()).toBe(14)
    expect(service.movementsTotal()).toBe(21)
  })
})
