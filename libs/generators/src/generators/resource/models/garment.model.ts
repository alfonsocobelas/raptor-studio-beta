import { defineResource } from '@raptor/schema'

// Demo model: clothing warehouse inventory.
export const garment = defineResource({
  schemaVersion: 1,
  name: 'garment',
  plural: 'garments',
  context: 'warehouse',
  schemaName: 'warehouse',
  route: '/warehouse/garments',
  sharedDomainAlias: '@app/shared/domain',
  labels: { singular: 'Prenda', plural: 'Prendas', subtitle: 'Inventario del almacén', gender: 'f' },
  formSections: [
    { id: 'general', title: 'Datos de la prenda' },
    { id: 'stock', title: 'Stock y precio' }
  ],
  constraintsConst: 'GARMENT_CONSTRAINTS',
  audit: true,
  constraints: {
    SKU: { MIN: 4, MAX: 20 },
    NAME: { MIN: 2, MAX: 120 },
    BRAND: { MAX: 60 },
    COLOR: { MAX: 40 },
    PRICE: { MIN: 0 },
    STOCK: { MIN: 0 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    sku: {
      type: 'string',
      unique: true,
      required: true,
      vo: {
        name: 'Sku',
        fieldName: 'SKU',
        ensure: 'string',
        noInnerWhitespace: true,
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'SKU'
      },
      form: { control: 'text', label: 'SKU', section: 'general', order: 1 },
      query: { filterable: 2, sortable: 2, searchable: 2 },
      table: { show: true, order: 2, label: 'SKU', minWidth: 130 },
      column: { type: 'varchar', lengthConst: 'SKU.MAX' }
    },
    name: {
      type: 'string',
      required: true,
      vo: {
        name: 'GarmentName',
        fieldName: 'Garment name',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'NAME'
      },
      form: { control: 'text', label: 'Nombre', section: 'general', order: 2, fullWidth: true },
      query: { filterable: 3, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Prenda', filterable: true, minWidth: 220 },
      column: { type: 'varchar', lengthConst: 'NAME.MAX' }
    },
    category: {
      type: 'string',
      required: true,
      vo: {
        name: 'GarmentCategory',
        fieldName: 'Garment category',
        values: ['tshirt', 'trousers', 'dress', 'jacket', 'accessory']
      },
      form: {
        control: 'select',
        label: 'Categoría',
        section: 'general',
        order: 3,
        placeholder: 'Seleccionar categoría',
        options: [
          { value: 'tshirt', label: 'Camisetas' },
          { value: 'trousers', label: 'Pantalones' },
          { value: 'dress', label: 'Vestidos' },
          { value: 'jacket', label: 'Abrigos' },
          { value: 'accessory', label: 'Accesorios' }
        ]
      },
      query: { filterable: 4, sortable: 3 },
      table: {
        show: true,
        order: 3,
        label: 'Categoría',
        filterable: true,
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          tshirt: { label: 'Camisetas', variant: 'outline' },
          trousers: { label: 'Pantalones', variant: 'secondary' },
          dress: { label: 'Vestidos', variant: 'default' },
          jacket: { label: 'Abrigos', variant: 'secondary' },
          accessory: { label: 'Accesorios', variant: 'outline' }
        }
      },
      column: { type: 'varchar', length: 20 }
    },
    size: {
      type: 'string',
      required: true,
      vo: { name: 'GarmentSize', fieldName: 'Garment size', values: ['XS', 'S', 'M', 'L', 'XL', 'unique'] },
      form: {
        control: 'select',
        label: 'Talla',
        section: 'general',
        order: 4,
        placeholder: 'Seleccionar talla',
        options: [
          { value: 'XS', label: 'XS' },
          { value: 'S', label: 'S' },
          { value: 'M', label: 'M' },
          { value: 'L', label: 'L' },
          { value: 'XL', label: 'XL' },
          { value: 'unique', label: 'Única' }
        ]
      },
      query: { filterable: 5 },
      table: { show: true, order: 4, label: 'Talla', filterable: true, minWidth: 90 },
      column: { type: 'varchar', length: 10 }
    },
    brand: {
      type: 'string',
      vo: { name: 'GarmentBrand', fieldName: 'Garment brand', lengthRule: 'max', constraintKey: 'BRAND' },
      form: { control: 'text', label: 'Marca', section: 'general', order: 5 },
      query: { filterable: 6, sortable: 4, searchable: 3 },
      table: { show: true, order: 5, label: 'Marca', filterable: true, minWidth: 130 },
      column: { type: 'varchar', lengthConst: 'BRAND.MAX', default: '' }
    },
    color: {
      type: 'string',
      vo: { name: 'GarmentColor', fieldName: 'Garment color', lengthRule: 'max', constraintKey: 'COLOR' },
      form: { control: 'text', label: 'Color', section: 'general', order: 6 },
      query: { searchable: 4 },
      table: { show: true, order: 6, label: 'Color', minWidth: 110 },
      column: { type: 'varchar', lengthConst: 'COLOR.MAX', default: '' }
    },
    price: {
      type: 'number',
      required: true,
      vo: { name: 'GarmentPrice', fieldName: 'Garment price', min: true, constraintKey: 'PRICE' },
      form: { control: 'number', label: 'Precio (€)', section: 'stock', order: 1 },
      query: { sortable: 5 },
      table: { show: true, order: 7, label: 'Precio', type: 'number', minWidth: 100 },
      column: { type: 'numeric', precision: 10, scale: 2, default: 0, transformer: 'numeric' }
    },
    stock: {
      type: 'integer',
      required: true,
      vo: { name: 'StockUnits', fieldName: 'Stock units', min: true, constraintKey: 'STOCK' },
      form: { control: 'number', label: 'Unidades en stock', section: 'stock', order: 2 },
      query: { sortable: 6 },
      table: { show: true, order: 8, label: 'Stock', type: 'number', minWidth: 90 },
      column: { type: 'int', default: 0 }
    },
    status: {
      type: 'string',
      required: true,
      vo: { name: 'GarmentStatus', fieldName: 'Garment status', values: ['active', 'discontinued'] },
      form: {
        control: 'select',
        label: 'Estado',
        section: 'stock',
        order: 3,
        placeholder: 'Seleccionar estado',
        options: [
          { value: 'active', label: 'Activa' },
          { value: 'discontinued', label: 'Descatalogada' }
        ]
      },
      query: { filterable: 7 },
      table: {
        show: true,
        order: 9,
        label: 'Estado',
        filterable: true,
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          active: { label: 'Activa', variant: 'default' },
          discontinued: { label: 'Descatalogada', variant: 'secondary' }
        }
      },
      column: { type: 'varchar', length: 20, default: 'active' }
    }
  },
  list: {
    deleteLabelField: 'name',
    defaultSort: { field: 'name', dir: 'asc' },
    features: { create: true, export: ['csv'], search: true, view: false, edit: true, delete: true }
  }
})
