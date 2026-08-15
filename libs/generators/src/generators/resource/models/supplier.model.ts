import { defineResource } from '@raptor/schema'

// Demo model: clothing warehouse suppliers.
export const supplier = defineResource({
  schemaVersion: 1,
  name: 'supplier',
  plural: 'suppliers',
  context: 'warehouse',
  schemaName: 'warehouse',
  route: '/warehouse/suppliers',
  sharedDomainAlias: '@app/shared/domain',
  labels: { singular: 'Proveedor', plural: 'Proveedores', subtitle: 'Proveedores del almacén', gender: 'm' },
  formSections: [{ id: 'general', title: 'Datos del proveedor' }],
  constraintsConst: 'SUPPLIER_CONSTRAINTS',
  audit: true,
  constraints: {
    NAME: { MIN: 2, MAX: 200 },
    TAX_ID: { MAX: 20 },
    EMAIL: { MAX: 200 },
    PHONE: { MAX: 20 },
    CITY: { MAX: 100 },
    LEAD_TIME: { MIN: 0 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    name: {
      type: 'string',
      required: true,
      vo: {
        name: 'SupplierName',
        fieldName: 'Supplier name',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'NAME'
      },
      form: { control: 'text', label: 'Nombre', section: 'general', order: 1, fullWidth: true },
      query: { filterable: 2, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Proveedor', filterable: true, minWidth: 220 },
      column: { type: 'varchar', lengthConst: 'NAME.MAX' }
    },
    taxId: {
      type: 'string',
      unique: true,
      vo: {
        name: 'SupplierTaxId',
        fieldName: 'Tax ID',
        noInnerWhitespace: true,
        lengthRule: 'max',
        constraintKey: 'TAX_ID'
      },
      form: { control: 'text', label: 'CIF', section: 'general', order: 2 },
      query: { filterable: 3, searchable: 2 },
      table: { show: true, order: 2, label: 'CIF', minWidth: 120 },
      column: { type: 'varchar', lengthConst: 'TAX_ID.MAX', default: '' }
    },
    email: {
      type: 'string',
      vo: {
        name: 'SupplierEmail',
        fieldName: 'Supplier email',
        lengthRule: 'max',
        email: true,
        constraintKey: 'EMAIL'
      },
      form: { control: 'text', label: 'Email', section: 'general', order: 3 },
      query: { searchable: 3 },
      table: { show: true, order: 3, label: 'Email', sortable: false, minWidth: 220 },
      column: { type: 'varchar', lengthConst: 'EMAIL.MAX', default: '' }
    },
    phone: {
      type: 'string',
      vo: { name: 'SupplierPhone', fieldName: 'Supplier phone', lengthRule: 'max', constraintKey: 'PHONE' },
      form: { control: 'text', label: 'Teléfono', section: 'general', order: 4 },
      query: { searchable: 4 },
      table: { show: true, order: 4, label: 'Teléfono', sortable: false, minWidth: 140 },
      column: { type: 'varchar', lengthConst: 'PHONE.MAX', default: '' }
    },
    city: {
      type: 'string',
      vo: { name: 'SupplierCity', fieldName: 'Supplier city', lengthRule: 'max', constraintKey: 'CITY' },
      form: { control: 'text', label: 'Ciudad', section: 'general', order: 5 },
      query: { filterable: 4, sortable: 2, searchable: 5 },
      table: { show: true, order: 5, label: 'Ciudad', filterable: true, minWidth: 130 },
      column: { type: 'varchar', lengthConst: 'CITY.MAX', default: '' }
    },
    leadTimeDays: {
      type: 'integer',
      required: true,
      vo: { name: 'LeadTimeDays', fieldName: 'Lead time days', min: true, constraintKey: 'LEAD_TIME' },
      form: { control: 'number', label: 'Plazo de entrega (días)', section: 'general', order: 6 },
      query: { sortable: 3 },
      table: { show: true, order: 6, label: 'Plazo (días)', type: 'number', minWidth: 110 },
      column: { type: 'int', default: 0 }
    }
  },
  list: {
    deleteLabelField: 'name',
    defaultSort: { field: 'name', dir: 'asc' },
    features: { create: true, export: ['csv'], search: true, view: false, edit: true, delete: true }
  }
})
