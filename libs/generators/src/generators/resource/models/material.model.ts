import { defineResource } from '@raptor/schema'

// Demo model (Solaris Energía): catálogo de paneles, inversores, baterías y estructura.
// Estrena DOS piezas que ningún modelo registrado usaba: la galería de tarjetas (spec 17)
// y el import CSV en una demo (spec 33) — la tarifa del proveedor llega en fichero.
export const material = defineResource({
  schemaVersion: 1,
  name: 'material',
  plural: 'materials',
  context: 'solaris',
  brief: 'El catálogo que consulta compras. La tarifa llega del proveedor en CSV cada trimestre y se sube en bloque en vez de teclearse.',
  schemaName: 'solaris',
  route: '/solaris/materials',
  sharedDomainAlias: '@solaris/shared/domain',
  labels: {
    singular: 'Material',
    plural: 'Material',
    subtitle: 'Catálogo de paneles, inversores, baterías y estructura',
    gender: 'm'
  },
  formSections: [{ id: 'general', title: 'Datos del artículo' }],
  constraintsConst: 'MATERIAL_CONSTRAINTS',
  audit: true,
  // Escotilla de borrado FÍSICO (spec 38): un catálogo puro cuya tarifa se reimporta entera
  // por CSV cada trimestre no tiene historia que preservar.
  softDelete: false,
  detail: {},
  gallery: { title: 'reference', subtitle: 'description', metric: 'price' },
  constraints: {
    REFERENCE: { MIN: 3, MAX: 60 },
    DESCRIPTION: { MAX: 200 },
    SUPPLIER: { MAX: 120 },
    PRICE: { MIN: 0 },
    STOCK: { MIN: 0 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    reference: {
      type: 'string',
      required: true,
      unique: true,
      vo: {
        name: 'MaterialReference',
        fieldName: 'Material reference',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'REFERENCE'
      },
      form: { control: 'text', label: 'Referencia', section: 'general', order: 1 },
      query: { filterable: 2, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Referencia', filterable: true, minWidth: 180 },
      samples: [
        'JKM-585N-72HL4',
        'SUN2000-60KTL',
        'LUNA2000-10-S0',
        'EST-COP-15',
        'TSM-450NEG9R',
        'SYM-20-3-M',
        'BYD-HVS-7.7',
        'EST-TRI-30',
        'LR5-72HTH-580M',
        'FRO-SYM-GEN24-10'
      ],
      column: { type: 'varchar', lengthConst: 'REFERENCE.MAX' }
    },
    description: {
      type: 'string',
      required: true,
      vo: {
        name: 'MaterialDescription',
        fieldName: 'Material description',
        lengthRule: 'max',
        constraintKey: 'DESCRIPTION'
      },
      form: { control: 'text', label: 'Descripción', section: 'general', order: 2, fullWidth: true },
      query: { searchable: 2 },
      table: { show: true, order: 2, label: 'Descripción', sortable: false, minWidth: 260 },
      samples: [
        'Panel monocristalino 585 W bifacial',
        'Inversor trifásico 60 kW',
        'Batería LiFePO4 10 kWh',
        'Estructura coplanar 15 paneles',
        'Panel 450 W marco negro',
        'Inversor trifásico 20 kW',
        'Batería alta tensión 7,7 kWh',
        'Estructura triangular 30º',
        'Panel 580 W alta eficiencia',
        'Inversor híbrido 10 kW'
      ],
      column: { type: 'varchar', lengthConst: 'DESCRIPTION.MAX', default: '' }
    },
    materialType: {
      type: 'string',
      required: true,
      vo: {
        name: 'MaterialType',
        fieldName: 'Material type',
        values: ['panel', 'inverter', 'battery', 'structure']
      },
      form: {
        control: 'select',
        label: 'Tipo',
        id: 'type',
        section: 'general',
        order: 3,
        placeholder: 'Seleccionar tipo',
        options: [
          { value: 'panel', label: 'Panel' },
          { value: 'inverter', label: 'Inversor' },
          { value: 'battery', label: 'Batería' },
          { value: 'structure', label: 'Estructura' }
        ]
      },
      query: { filterable: 3, sortable: 2 },
      table: {
        show: true,
        order: 3,
        label: 'Tipo',
        filterable: true,
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          panel: { label: 'Panel', variant: 'default' },
          inverter: { label: 'Inversor', variant: 'secondary' },
          battery: { label: 'Batería', variant: 'outline' },
          structure: { label: 'Estructura', variant: 'ghost' }
        }
      },
      samples: [
        'panel',
        'inverter',
        'battery',
        'structure',
        'panel',
        'inverter',
        'battery',
        'structure',
        'panel',
        'inverter'
      ],
      column: { type: 'varchar', length: 20, default: 'panel' }
    },
    supplierName: {
      type: 'string',
      required: true,
      vo: { name: 'MaterialSupplier', fieldName: 'Supplier', lengthRule: 'max', constraintKey: 'SUPPLIER' },
      form: { control: 'text', label: 'Proveedor', section: 'general', order: 4 },
      query: { filterable: 4, sortable: 3, searchable: 3 },
      table: { show: true, order: 4, label: 'Proveedor', filterable: true, minWidth: 150 },
      samples: [
        'Jinko Solar',
        'Huawei',
        'Huawei',
        'Sunfer',
        'Trina Solar',
        'Fronius',
        'BYD',
        'Sunfer',
        'LONGi',
        'Fronius'
      ],
      column: { type: 'varchar', lengthConst: 'SUPPLIER.MAX', default: '' }
    },
    price: {
      type: 'number',
      required: true,
      vo: { name: 'MaterialPrice', fieldName: 'Material price', min: true, constraintKey: 'PRICE' },
      form: { control: 'number', label: 'Precio unitario', section: 'general', order: 5 },
      query: { sortable: 4 },
      table: { show: true, order: 5, label: 'Precio', type: 'number', minWidth: 120 },
      samples: [118.4, 2740, 3980, 96.5, 92.3, 1650, 3120, 148.9, 121.7, 2180],
      column: { type: 'numeric', precision: 12, scale: 2, transformer: 'numeric', default: 0 }
    },
    stock: {
      type: 'integer',
      required: true,
      vo: { name: 'MaterialStock', fieldName: 'Material stock', min: true, constraintKey: 'STOCK' },
      form: { control: 'number', label: 'Stock', section: 'general', order: 6 },
      query: { sortable: 5 },
      table: { show: true, order: 6, label: 'Stock', type: 'number', minWidth: 100 },
      samples: [420, 6, 3, 88, 260, 4, 5, 51, 310, 7],
      column: { type: 'int', default: 0 }
    }
  },
  list: {
    deleteLabelField: 'reference',
    defaultSort: { field: 'reference', dir: 'asc' },
    features: { create: true, export: ['csv'], search: true, view: true, edit: true, delete: true, import: true }
  }
})
