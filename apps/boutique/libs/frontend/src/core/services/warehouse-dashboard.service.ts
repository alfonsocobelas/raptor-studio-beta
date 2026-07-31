import { HttpClient } from '@angular/common/http'
import { Injectable, computed, inject, resource } from '@angular/core'
import { GarmentDto } from '@app/shared/domain'
import { firstValueFrom } from 'rxjs'
import { OffsetPaginatedOutput } from './garment.service'

/** Umbral por debajo del cual una prenda activa cuenta como "stock bajo". */
export const LOW_STOCK_THRESHOLD = 5

/** Etiquetas de categoría (mismo vocabulario que el badgeMap del listado). */
const CATEGORY_LABELS: Record<string, string> = {
  tshirt: 'Camisetas',
  trousers: 'Pantalones',
  dress: 'Vestidos',
  jacket: 'Abrigos',
  accessory: 'Accesorios'
}

export interface CategoryStock {
  label: string
  value: number
}

/**
 * Agregados del dashboard de almacén. Carga el inventario en una página (máximo 100
 * referencias, el tope del backend; escala de demo sin endpoint de agregación) y
 * deriva los KPIs con computed().
 */
@Injectable({ providedIn: 'root' })
export class WarehouseDashboardService {
  private readonly _http = inject(HttpClient)

  readonly inventory = resource<OffsetPaginatedOutput<GarmentDto>, unknown>({
    loader: () =>
      firstValueFrom(
        this._http.get<OffsetPaginatedOutput<GarmentDto>>('/api/v1/garments', {
          params: { page: '1', pageSize: '100' }
        })
      )
  })

  private readonly _items = computed(() => (this.inventory.hasValue() ? this.inventory.value().items : []))

  readonly totalReferences = computed(() => this._items().length)

  readonly totalUnits = computed(() => this._items().reduce((sum, g) => sum + g.stock, 0))

  readonly inventoryValue = computed(() => this._items().reduce((sum, g) => sum + g.price * g.stock, 0))

  readonly lowStockCount = computed(
    () => this._items().filter(g => g.status === 'active' && g.stock <= LOW_STOCK_THRESHOLD).length
  )

  readonly stockByCategory = computed<CategoryStock[]>(() => {
    const byCategory = new Map<string, number>()
    for (const g of this._items()) {
      byCategory.set(g.category, (byCategory.get(g.category) ?? 0) + g.stock)
    }
    return [...byCategory.entries()]
      .map(([category, value]) => ({ label: CATEGORY_LABELS[category] ?? category, value }))
      .sort((a, b) => b.value - a.value)
  })
}
