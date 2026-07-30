import { ExportColumn } from '../../../../../shared/infrastructure/export/export-column'
import { VehiclePrimitiveProps } from '../../domain/vehicle-types'

const FUEL_LABELS: Record<string, string> = {
  gasoline: 'Gasolina',
  diesel: 'Diésel',
  hybrid: 'Híbrido',
  electric: 'Eléctrico'
}
const STATUS_LABELS: Record<string, string> = {
  stock: 'En stock',
  reserved: 'Reservado',
  sold: 'Vendido',
  workshop: 'En taller'
}

const label = (map: Record<string, string>, value: unknown): string => map[value as string] ?? String(value)

// Canonical export set: mirrors the vehicles table columns and labels, so the file matches the screen.
export const VEHICLE_EXPORT_COLUMNS: ExportColumn<VehiclePrimitiveProps>[] = [
  { key: 'brand', header: 'Marca' },
  { key: 'model', header: 'Modelo' },
  { key: 'version', header: 'Versión' },
  { key: 'year', header: 'Año' },
  { key: 'mileage', header: 'Km' },
  { key: 'fuel', header: 'Combustible', format: value => label(FUEL_LABELS, value) },
  { key: 'price', header: 'Precio' },
  { key: 'vin', header: 'VIN' },
  { key: 'plate', header: 'Matrícula' },
  { key: 'status', header: 'Estado', format: value => label(STATUS_LABELS, value) }
]
