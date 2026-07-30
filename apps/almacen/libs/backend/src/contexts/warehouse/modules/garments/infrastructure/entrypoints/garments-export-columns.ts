import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { GarmentPrimitiveProps } from '../../domain/garment-types'

const CATEGORY_LABELS: Record<string, string> = {
  tshirt: 'Camisetas',
  trousers: 'Pantalones',
  dress: 'Vestidos',
  jacket: 'Abrigos',
  accessory: 'Accesorios'
}
const STATUS_LABELS: Record<string, string> = { active: 'Activa', discontinued: 'Descatalogada' }

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the garments table columns and labels, so the file matches the screen.
export const GARMENT_EXPORT_COLUMNS: ExportColumn<GarmentPrimitiveProps>[] = [
  { key: 'name', header: 'Prenda' },
  { key: 'sku', header: 'SKU' },
  { key: 'category', header: 'Categoría', format: value => label(CATEGORY_LABELS, value) },
  { key: 'size', header: 'Talla' },
  { key: 'brand', header: 'Marca' },
  { key: 'color', header: 'Color' },
  { key: 'price', header: 'Precio' },
  { key: 'stock', header: 'Stock' },
  { key: 'status', header: 'Estado', format: value => label(STATUS_LABELS, value) }
]
