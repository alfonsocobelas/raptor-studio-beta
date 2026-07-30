import { defineResource } from '@acc/schema'

// Demo model: warehouse stock movements (goods in / goods out).
export const movement = defineResource({
  schemaVersion: 1,
  name: 'movement',
  plural: 'movements',
  context: 'warehouse',
  schemaName: 'warehouse',
  route: '/warehouse/movements',
  sharedDomainAlias: '@app/shared/domain',
  labels: { singular: 'Movimiento', plural: 'Movimientos', subtitle: 'Entradas y salidas de stock', gender: 'm' },
  formSections: [{ id: 'general', title: 'Datos del movimiento' }],
  constraintsConst: 'MOVEMENT_CONSTRAINTS',
  audit: true,
  constraints: {
    REFERENCE: { MIN: 3, MAX: 20 },
    GARMENT_LABEL: { MIN: 2, MAX: 200 },
    COUNTERPARTY: { MAX: 200 },
    QUANTITY: { MIN: 1 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    reference: {
      type: 'string',
      unique: true,
      required: true,
      vo: {
        name: 'MovementReference',
        fieldName: 'Movement reference',
        ensure: 'string',
        noInnerWhitespace: true,
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'REFERENCE'
      },
      form: { control: 'text', label: 'Referencia', section: 'general', order: 1 },
      query: { filterable: 2, sortable: 2, searchable: 1 },
      table: { show: true, order: 1, label: 'Referencia', minWidth: 130 },
      column: { type: 'varchar', lengthConst: 'REFERENCE.MAX' }
    },
    movementDate: {
      type: 'date',
      required: true,
      vo: { name: 'MovementDate', fieldName: 'Movement date' },
      form: { control: 'date', label: 'Fecha', section: 'general', order: 2 },
      query: { sortable: 1, filterable: 3 },
      table: { show: true, order: 2, label: 'Fecha', type: 'date', minWidth: 110 },
      column: { type: 'date', tsType: 'string' }
    },
    movementType: {
      type: 'string',
      required: true,
      vo: { name: 'MovementType', fieldName: 'Movement type', values: ['in', 'out'] },
      form: {
        control: 'select',
        label: 'Tipo',
        id: 'type',
        section: 'general',
        order: 3,
        placeholder: 'Seleccionar tipo',
        options: [
          { value: 'in', label: 'Entrada' },
          { value: 'out', label: 'Salida' }
        ]
      },
      query: { filterable: 4, sortable: 3 },
      table: {
        show: true,
        order: 3,
        label: 'Tipo',
        filterable: true,
        minWidth: 110,
        type: 'badge',
        badgeMap: {
          in: { label: 'Entrada', variant: 'default' },
          out: { label: 'Salida', variant: 'secondary' }
        }
      },
      column: { type: 'varchar', length: 10 }
    },
    garmentLabel: {
      type: 'string',
      required: true,
      vo: {
        name: 'MovementGarmentLabel',
        fieldName: 'Movement garment',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'GARMENT_LABEL'
      },
      form: { control: 'text', label: 'Prenda', section: 'general', order: 4, fullWidth: true },
      query: { sortable: 4, searchable: 2 },
      table: { show: true, order: 4, label: 'Prenda', minWidth: 220 },
      column: { type: 'varchar', lengthConst: 'GARMENT_LABEL.MAX' }
    },
    quantity: {
      type: 'integer',
      required: true,
      vo: { name: 'MovementQuantity', fieldName: 'Movement quantity', min: true, constraintKey: 'QUANTITY' },
      form: { control: 'number', label: 'Unidades', section: 'general', order: 5 },
      query: { sortable: 5 },
      table: { show: true, order: 5, label: 'Unidades', type: 'number', minWidth: 100 },
      column: { type: 'int' }
    },
    counterparty: {
      type: 'string',
      vo: {
        name: 'MovementCounterparty',
        fieldName: 'Movement counterparty',
        lengthRule: 'max',
        constraintKey: 'COUNTERPARTY'
      },
      form: { control: 'text', label: 'Origen / destino', section: 'general', order: 6, fullWidth: true },
      query: { searchable: 3 },
      table: { show: true, order: 6, label: 'Origen / destino', sortable: false, minWidth: 200 },
      column: { type: 'varchar', lengthConst: 'COUNTERPARTY.MAX', default: '' }
    },
    reason: {
      type: 'string',
      required: true,
      vo: { name: 'MovementReason', fieldName: 'Movement reason', values: ['purchase', 'sale', 'return', 'adjustment'] },
      form: {
        control: 'select',
        label: 'Motivo',
        section: 'general',
        order: 7,
        placeholder: 'Seleccionar motivo',
        options: [
          { value: 'purchase', label: 'Compra' },
          { value: 'sale', label: 'Venta' },
          { value: 'return', label: 'Devolución' },
          { value: 'adjustment', label: 'Ajuste de inventario' }
        ]
      },
      query: { filterable: 5 },
      table: {
        show: true,
        order: 7,
        label: 'Motivo',
        filterable: true,
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          purchase: { label: 'Compra', variant: 'outline' },
          sale: { label: 'Venta', variant: 'default' },
          return: { label: 'Devolución', variant: 'secondary' },
          adjustment: { label: 'Ajuste', variant: 'outline' }
        }
      },
      column: { type: 'varchar', length: 20 }
    }
  },
  list: {
    deleteLabelField: 'reference',
    defaultSort: { field: 'movementDate', dir: 'desc' },
    features: { create: true, export: ['csv'], search: true, view: false, edit: true, delete: true }
  }
})
