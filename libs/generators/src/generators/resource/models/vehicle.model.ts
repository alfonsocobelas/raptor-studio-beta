import { defineResource } from '@raptor/schema'

// Demo model: dealership inventory. Written from scratch against the canonical DSL
// (not transcribed from a golden module) to exercise the generator on a new domain.
export const vehicle = defineResource({
  schemaVersion: 1,
  name: 'vehicle',
  plural: 'vehicles',
  context: 'dealership',
  schemaName: 'dealership',
  route: '/dealership/vehicles',
  sharedDomainAlias: '@concesionario/shared/domain',
  labels: { singular: 'Vehículo', plural: 'Vehículos', subtitle: 'Inventario del concesionario', gender: 'm' },
  formSections: [
    { id: 'general', title: 'Datos del vehículo' },
    { id: 'commercial', title: 'Datos comerciales' },
    { id: 'notes', title: 'Notas' }
  ],
  constraintsConst: 'VEHICLE_CONSTRAINTS',
  audit: true,
  constraints: {
    VIN: { MIN: 11, MAX: 17 },
    BRAND: { MIN: 2, MAX: 60 },
    MODEL: { MIN: 1, MAX: 80 },
    VERSION: { MAX: 120 },
    PLATE: { MAX: 12 },
    COLOR: { MAX: 40 },
    YEAR: { MIN: 1990 },
    MILEAGE: { MIN: 0 },
    PRICE: { MIN: 0 },
    NOTES: { MAX: 1000 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    vin: {
      type: 'string',
      unique: true,
      required: true,
      vo: {
        name: 'Vin',
        fieldName: 'VIN',
        ensure: 'string',
        noInnerWhitespace: true,
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'VIN'
      },
      form: { control: 'text', label: 'Bastidor (VIN)', section: 'general', order: 1 },
      query: { filterable: 2, sortable: 5, searchable: 4 },
      table: { show: true, order: 8, label: 'VIN', sortable: false, minWidth: 170 },
      column: { type: 'varchar', lengthConst: 'VIN.MAX' }
    },
    brand: {
      type: 'string',
      required: true,
      vo: {
        name: 'VehicleBrand',
        fieldName: 'Vehicle brand',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'BRAND'
      },
      form: { control: 'text', label: 'Marca', section: 'general', order: 2 },
      query: { filterable: 3, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Marca', filterable: true, minWidth: 140 },
      column: { type: 'varchar', lengthConst: 'BRAND.MAX' }
    },
    model: {
      type: 'string',
      required: true,
      vo: {
        name: 'VehicleModel',
        fieldName: 'Vehicle model',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'MODEL'
      },
      form: { control: 'text', label: 'Modelo', section: 'general', order: 3 },
      query: { filterable: 4, sortable: 2, searchable: 2 },
      table: { show: true, order: 2, label: 'Modelo', filterable: true, minWidth: 150 },
      column: { type: 'varchar', lengthConst: 'MODEL.MAX' }
    },
    version: {
      type: 'string',
      vo: { name: 'VehicleVersion', fieldName: 'Vehicle version', lengthRule: 'max', constraintKey: 'VERSION' },
      form: { control: 'text', label: 'Versión / acabado', section: 'general', order: 4, fullWidth: true },
      query: { searchable: 3 },
      table: { show: true, order: 3, label: 'Versión', sortable: false, minWidth: 190 },
      column: { type: 'varchar', lengthConst: 'VERSION.MAX', default: '' }
    },
    plate: {
      type: 'string',
      unique: true,
      vo: { name: 'Plate', fieldName: 'Plate', lengthRule: 'max', constraintKey: 'PLATE' },
      form: { control: 'text', label: 'Matrícula', section: 'general', order: 5 },
      query: { filterable: 5, sortable: 6, searchable: 5 },
      table: { show: true, order: 9, label: 'Matrícula', minWidth: 120 },
      column: { type: 'varchar', lengthConst: 'PLATE.MAX', default: '' }
    },
    color: {
      type: 'string',
      vo: { name: 'VehicleColor', fieldName: 'Vehicle color', lengthRule: 'max', constraintKey: 'COLOR' },
      form: { control: 'text', label: 'Color', section: 'general', order: 6 },
      query: { searchable: 6 },
      column: { type: 'varchar', lengthConst: 'COLOR.MAX', default: '' }
    },
    fuel: {
      type: 'string',
      required: true,
      vo: {
        name: 'FuelType',
        fieldName: 'Fuel type',
        values: ['gasoline', 'diesel', 'hybrid', 'electric']
      },
      form: {
        control: 'select',
        label: 'Combustible',
        section: 'general',
        order: 7,
        placeholder: 'Seleccionar combustible',
        options: [
          { value: 'gasoline', label: 'Gasolina' },
          { value: 'diesel', label: 'Diésel' },
          { value: 'hybrid', label: 'Híbrido' },
          { value: 'electric', label: 'Eléctrico' }
        ]
      },
      query: { filterable: 6, sortable: 7 },
      table: {
        show: true,
        order: 6,
        label: 'Combustible',
        filterable: true,
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          gasoline: { label: 'Gasolina', variant: 'outline' },
          diesel: { label: 'Diésel', variant: 'secondary' },
          hybrid: { label: 'Híbrido', variant: 'default' },
          electric: { label: 'Eléctrico', variant: 'default' }
        }
      },
      column: { type: 'varchar', length: 20 }
    },
    year: {
      type: 'integer',
      required: true,
      vo: { name: 'VehicleYear', fieldName: 'Vehicle year', min: true, constraintKey: 'YEAR' },
      form: { control: 'number', label: 'Año', section: 'commercial', order: 1 },
      query: { sortable: 3, filterable: 7 },
      table: { show: true, order: 4, label: 'Año', type: 'number', minWidth: 90 },
      column: { type: 'int' }
    },
    mileage: {
      type: 'integer',
      required: true,
      vo: { name: 'Mileage', fieldName: 'Mileage', min: true, constraintKey: 'MILEAGE' },
      form: { control: 'number', label: 'Kilómetros', section: 'commercial', order: 2 },
      query: { sortable: 4 },
      table: { show: true, order: 5, label: 'Km', type: 'number', minWidth: 110 },
      column: { type: 'int', default: 0 }
    },
    price: {
      type: 'number',
      required: true,
      vo: { name: 'Price', fieldName: 'Price', min: true, constraintKey: 'PRICE' },
      form: { control: 'number', label: 'Precio (€)', section: 'commercial', order: 3 },
      query: { sortable: 8 },
      table: { show: true, order: 7, label: 'Precio', type: 'number', minWidth: 120 },
      column: { type: 'numeric', precision: 12, scale: 2, default: 0, transformer: 'numeric' }
    },
    status: {
      type: 'string',
      required: true,
      vo: {
        name: 'VehicleStatus',
        fieldName: 'Vehicle status',
        values: ['stock', 'reserved', 'sold', 'workshop']
      },
      form: {
        control: 'select',
        label: 'Estado',
        section: 'commercial',
        order: 4,
        placeholder: 'Seleccionar estado',
        options: [
          { value: 'stock', label: 'En stock' },
          { value: 'reserved', label: 'Reservado' },
          { value: 'sold', label: 'Vendido' },
          { value: 'workshop', label: 'En taller' }
        ]
      },
      query: { filterable: 8, sortable: 9 },
      table: {
        show: true,
        order: 10,
        label: 'Estado',
        filterable: true,
        minWidth: 120,
        type: 'badge',
        badgeMap: {
          stock: { label: 'En stock', variant: 'default' },
          reserved: { label: 'Reservado', variant: 'secondary' },
          sold: { label: 'Vendido', variant: 'outline' },
          workshop: { label: 'En taller', variant: 'secondary' }
        }
      },
      column: { type: 'varchar', length: 20, default: 'stock' }
    },
    notes: {
      type: 'string',
      vo: { name: 'VehicleNotes', fieldName: 'Vehicle notes', lengthRule: 'max', constraintKey: 'NOTES' },
      form: { control: 'textarea', label: 'Notas internas', section: 'notes', order: 1, rows: 3, fullWidth: true },
      column: { type: 'varchar', lengthConst: 'NOTES.MAX', default: '' }
    }
  },
  // Borrado recuperable (spec 29): la demo del concesionario estrena la papelera
  softDelete: true,
  list: {
    deleteLabelField: 'plate',
    defaultSort: { field: 'brand', dir: 'asc' },
    features: { create: true, export: ['csv'], search: true, view: false, edit: true, delete: true }
  }
})
