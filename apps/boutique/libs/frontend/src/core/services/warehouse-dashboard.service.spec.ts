import { HttpClient } from '@angular/common/http'
import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { vi } from 'vitest'
import { GarmentDto } from '@app/shared/domain'
import { WarehouseDashboardService } from './warehouse-dashboard.service'

const tick = () => TestBed.flushEffects()

const garment = (overrides: Partial<GarmentDto>): GarmentDto => ({
  id: '019eb800-4d87-7000-8000-000000000001',
  sku: 'SKU-1',
  name: 'Prenda',
  category: 'tshirt',
  size: 'M',
  brand: '',
  color: '',
  price: 10,
  stock: 10,
  status: 'active',
  ...overrides
})

const ITEMS: GarmentDto[] = [
  garment({ id: '1', sku: 'TS-1', category: 'tshirt', price: 10, stock: 20 }),
  garment({ id: '2', sku: 'TS-2', category: 'tshirt', price: 20, stock: 4 }),
  garment({ id: '3', sku: 'PT-1', category: 'trousers', price: 40, stock: 30 }),
  garment({ id: '4', sku: 'AB-1', category: 'jacket', price: 100, stock: 2, status: 'discontinued' })
]

const PAGE = { items: ITEMS, total: 4, page: 1, pageSize: 100, totalPages: 1 }

describe('WarehouseDashboardService — agregados', () => {
  let service: WarehouseDashboardService
  let httpGet: ReturnType<typeof vi.fn>

  beforeEach(() => {
    httpGet = vi.fn().mockReturnValue(of(PAGE))
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: { get: httpGet } },
        WarehouseDashboardService
      ]
    })
    service = TestBed.inject(WarehouseDashboardService)
  })

  const load = async () => {
    tick()
    await Promise.resolve()
    await Promise.resolve()
  }

  it('loads the full inventory in a single page', async () => {
    await load()
    expect(httpGet).toHaveBeenCalledWith('/api/v1/garments', { params: { page: '1', pageSize: '100' } })
  })

  it('exposes empty aggregates while there is no data', () => {
    expect(service.totalReferences()).toBe(0)
    expect(service.totalUnits()).toBe(0)
    expect(service.inventoryValue()).toBe(0)
    expect(service.lowStockCount()).toBe(0)
    expect(service.stockByCategory()).toEqual([])
  })

  it('computes total references and units', async () => {
    await load()
    expect(service.totalReferences()).toBe(4)
    expect(service.totalUnits()).toBe(56)
  })

  it('computes inventory value as sum of price × stock', async () => {
    await load()
    // 10×20 + 20×4 + 40×30 + 100×2 = 1680
    expect(service.inventoryValue()).toBe(1680)
  })

  it('counts low stock only among active garments', async () => {
    await load()
    // stock ≤ 5: TS-2 (activa) y AB-1 (descatalogada, no cuenta)
    expect(service.lowStockCount()).toBe(1)
  })

  it('aggregates stock by category with Spanish labels, sorted desc', async () => {
    await load()
    expect(service.stockByCategory()).toEqual([
      { label: 'Pantalones', value: 30 },
      { label: 'Camisetas', value: 24 },
      { label: 'Abrigos', value: 2 }
    ])
  })
})
