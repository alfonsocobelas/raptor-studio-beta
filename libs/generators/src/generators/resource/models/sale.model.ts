import { defineResource } from '@acc/schema'

// Demo model: closed and in-flight dealership operations.
// Vehicle and client are denormalised on purpose: the demo exercises the canonical
// single-aggregate path, not cross-aggregate references.
export const sale = defineResource({
  schemaVersion: 1,
  name: 'sale',
  plural: 'sales',
  context: 'dealership',
  schemaName: 'dealership',
  route: '/dealership/sales',
  sharedDomainAlias: '@concesionario/shared/domain',
  labels: { singular: 'Venta', plural: 'Ventas', subtitle: 'Operaciones del concesionario', gender: 'f' },
  formSections: [
    { id: 'general', title: 'Datos de la operación' },
    { id: 'amounts', title: 'Importes' }
  ],
  constraintsConst: 'SALE_CONSTRAINTS',
  audit: true,
  constraints: {
    REFERENCE: { MIN: 3, MAX: 20 },
    VEHICLE_LABEL: { MIN: 2, MAX: 200 },
    CLIENT_LABEL: { MIN: 2, MAX: 200 },
    SALESPERSON: { MAX: 120 },
    AMOUNT: { MIN: 0 },
    DISCOUNT: { MIN: 0 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    reference: {
      type: 'string',
      unique: true,
      required: true,
      vo: {
        name: 'SaleReference',
        fieldName: 'Sale reference',
        ensure: 'string',
        noInnerWhitespace: true,
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'REFERENCE'
      },
      form: { control: 'text', label: 'Referencia', section: 'general', order: 1 },
      query: { filterable: 2, sortable: 2, searchable: 1 },
      table: { show: true, order: 1, label: 'Referencia', minWidth: 120 },
      column: { type: 'varchar', lengthConst: 'REFERENCE.MAX' }
    },
    saleDate: {
      type: 'date',
      required: true,
      vo: { name: 'SaleDate', fieldName: 'Sale date' },
      form: { control: 'date', label: 'Fecha', section: 'general', order: 2 },
      query: { sortable: 1, filterable: 3 },
      table: { show: true, order: 2, label: 'Fecha', type: 'date', minWidth: 120 },
      column: { type: 'date', tsType: 'string' }
    },
    vehicleLabel: {
      type: 'string',
      required: true,
      vo: {
        name: 'SaleVehicleLabel',
        fieldName: 'Sale vehicle',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'VEHICLE_LABEL'
      },
      form: { control: 'text', label: 'Vehículo', section: 'general', order: 3, fullWidth: true },
      query: { sortable: 3, searchable: 2 },
      table: { show: true, order: 3, label: 'Vehículo', minWidth: 200 },
      column: { type: 'varchar', lengthConst: 'VEHICLE_LABEL.MAX' }
    },
    clientLabel: {
      type: 'string',
      required: true,
      vo: {
        name: 'SaleClientLabel',
        fieldName: 'Sale client',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'CLIENT_LABEL'
      },
      form: { control: 'text', label: 'Cliente', section: 'general', order: 4, fullWidth: true },
      query: { sortable: 4, searchable: 3 },
      table: { show: true, order: 4, label: 'Cliente', minWidth: 190 },
      column: { type: 'varchar', lengthConst: 'CLIENT_LABEL.MAX' }
    },
    salesperson: {
      type: 'string',
      vo: { name: 'Salesperson', fieldName: 'Salesperson', lengthRule: 'max', constraintKey: 'SALESPERSON' },
      form: { control: 'text', label: 'Comercial', section: 'general', order: 5 },
      query: { filterable: 4, sortable: 5, searchable: 4 },
      table: { show: true, order: 5, label: 'Comercial', filterable: true, minWidth: 140 },
      column: { type: 'varchar', lengthConst: 'SALESPERSON.MAX', default: '' }
    },
    amount: {
      type: 'number',
      required: true,
      vo: { name: 'SaleAmount', fieldName: 'Sale amount', min: true, constraintKey: 'AMOUNT' },
      form: { control: 'number', label: 'Importe (€)', section: 'amounts', order: 1 },
      query: { sortable: 6 },
      table: { show: true, order: 6, label: 'Importe', type: 'number', minWidth: 120 },
      column: { type: 'numeric', precision: 12, scale: 2, default: 0, transformer: 'numeric' }
    },
    discount: {
      type: 'number',
      vo: { name: 'SaleDiscount', fieldName: 'Sale discount', min: true, constraintKey: 'DISCOUNT' },
      form: { control: 'number', label: 'Descuento (€)', section: 'amounts', order: 2 },
      column: { type: 'numeric', precision: 12, scale: 2, default: 0, transformer: 'numeric' }
    },
    paymentMethod: {
      type: 'string',
      required: true,
      vo: { name: 'PaymentMethod', fieldName: 'Payment method', values: ['cash', 'financing', 'leasing'] },
      form: {
        control: 'select',
        label: 'Forma de pago',
        section: 'amounts',
        order: 3,
        placeholder: 'Seleccionar forma de pago',
        options: [
          { value: 'cash', label: 'Contado' },
          { value: 'financing', label: 'Financiación' },
          { value: 'leasing', label: 'Renting / leasing' }
        ]
      },
      query: { filterable: 5, sortable: 7 },
      table: {
        show: true,
        order: 7,
        label: 'Pago',
        filterable: true,
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          cash: { label: 'Contado', variant: 'outline' },
          financing: { label: 'Financiación', variant: 'default' },
          leasing: { label: 'Renting', variant: 'secondary' }
        }
      },
      column: { type: 'varchar', length: 20, default: 'cash' }
    },
    status: {
      type: 'string',
      required: true,
      vo: { name: 'SaleStatus', fieldName: 'Sale status', values: ['pending', 'delivered', 'cancelled'] },
      form: {
        control: 'select',
        label: 'Estado',
        section: 'general',
        order: 6,
        placeholder: 'Seleccionar estado',
        options: [
          { value: 'pending', label: 'Pdte. entrega' },
          { value: 'delivered', label: 'Entregada' },
          { value: 'cancelled', label: 'Cancelada' }
        ]
      },
      query: { filterable: 6, sortable: 8 },
      table: {
        show: true,
        order: 8,
        label: 'Estado',
        filterable: true,
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          pending: { label: 'Pdte. entrega', variant: 'secondary' },
          delivered: { label: 'Entregada', variant: 'default' },
          cancelled: { label: 'Cancelada', variant: 'outline' }
        }
      },
      column: { type: 'varchar', length: 20, default: 'pending' }
    }
  },
  list: {
    deleteLabelField: 'reference',
    defaultSort: { field: 'saleDate', dir: 'desc' },
    features: { create: true, export: ['csv'], search: true, view: false, edit: true, delete: true }
  }
})
