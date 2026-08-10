import { defineResource } from '@acc/schema'

// Demo model: dealership customer base.
export const client = defineResource({
  schemaVersion: 1,
  name: 'client',
  plural: 'clients',
  context: 'dealership',
  schemaName: 'dealership',
  route: '/dealership/clients',
  sharedDomainAlias: '@concesionario/shared/domain',
  labels: { singular: 'Cliente', plural: 'Clientes', subtitle: 'Cartera de clientes', gender: 'm' },
  formSections: [
    { id: 'general', title: 'Datos de contacto' },
    { id: 'notes', title: 'Notas' }
  ],
  constraintsConst: 'CLIENT_CONSTRAINTS',
  audit: true,
  // Estrena el código de negocio (spec 19): un concesionario referencia a sus clientes por
  // CLI-0001, no por su uuid. Ningún modelo de oro lo declara, así que el gate sigue vacío.
  code: { prefix: 'CLI', padding: 4 },
  constraints: {
    NAME: { MIN: 2, MAX: 200 },
    TAX_ID: { MAX: 20 },
    EMAIL: { MAX: 200 },
    PHONE: { MAX: 20 },
    CITY: { MAX: 100 },
    ADDRESS: { MAX: 300 },
    NOTES: { MAX: 1000 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    name: {
      type: 'string',
      required: true,
      vo: {
        name: 'ClientName',
        fieldName: 'Client name',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'NAME'
      },
      form: { control: 'text', label: 'Nombre', section: 'general', order: 1, fullWidth: true },
      query: { filterable: 2, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Nombre', filterable: true, minWidth: 220 },
      column: { type: 'varchar', lengthConst: 'NAME.MAX' }
    },
    clientType: {
      type: 'string',
      required: true,
      vo: { name: 'ClientType', fieldName: 'Client type', values: ['individual', 'company'] },
      form: {
        control: 'select',
        label: 'Tipo',
        id: 'type',
        section: 'general',
        order: 2,
        placeholder: 'Seleccionar tipo',
        options: [
          { value: 'individual', label: 'Particular' },
          { value: 'company', label: 'Empresa' }
        ]
      },
      query: { filterable: 3, sortable: 2 },
      table: {
        show: true,
        order: 2,
        label: 'Tipo',
        filterable: true,
        minWidth: 120,
        type: 'badge',
        badgeMap: {
          individual: { label: 'Particular', variant: 'outline' },
          company: { label: 'Empresa', variant: 'secondary' }
        }
      },
      column: { type: 'varchar', length: 20, default: 'individual' }
    },
    taxId: {
      type: 'string',
      unique: true,
      vo: {
        name: 'ClientTaxId',
        fieldName: 'Tax ID',
        noInnerWhitespace: true,
        lengthRule: 'max',
        constraintKey: 'TAX_ID'
      },
      form: { control: 'text', label: 'DNI / CIF', section: 'general', order: 3 },
      query: { filterable: 4, sortable: 3, searchable: 2 },
      table: { show: true, order: 3, label: 'DNI / CIF', minWidth: 120 },
      column: { type: 'varchar', lengthConst: 'TAX_ID.MAX', default: '' }
    },
    email: {
      type: 'string',
      vo: { name: 'ClientEmail', fieldName: 'Client email', lengthRule: 'max', email: true, constraintKey: 'EMAIL' },
      form: { control: 'text', label: 'Email', section: 'general', order: 4 },
      query: { searchable: 3 },
      table: { show: true, order: 4, label: 'Email', sortable: false, minWidth: 220 },
      column: { type: 'varchar', lengthConst: 'EMAIL.MAX', default: '' }
    },
    phone: {
      type: 'string',
      vo: { name: 'ClientPhone', fieldName: 'Client phone', lengthRule: 'max', constraintKey: 'PHONE' },
      form: { control: 'text', label: 'Teléfono', section: 'general', order: 5 },
      query: { searchable: 4 },
      table: { show: true, order: 5, label: 'Teléfono', sortable: false, minWidth: 140 },
      column: { type: 'varchar', lengthConst: 'PHONE.MAX', default: '' }
    },
    city: {
      type: 'string',
      vo: { name: 'ClientCity', fieldName: 'Client city', lengthRule: 'max', constraintKey: 'CITY' },
      form: { control: 'text', label: 'Localidad', section: 'general', order: 6 },
      query: { filterable: 5, sortable: 4, searchable: 5 },
      table: { show: true, order: 6, label: 'Localidad', filterable: true, minWidth: 140 },
      column: { type: 'varchar', lengthConst: 'CITY.MAX', default: '' }
    },
    address: {
      type: 'string',
      vo: { name: 'ClientAddress', fieldName: 'Client address', lengthRule: 'max', constraintKey: 'ADDRESS' },
      form: { control: 'text', label: 'Dirección', section: 'general', order: 7, fullWidth: true },
      query: { searchable: 6 },
      column: { type: 'varchar', lengthConst: 'ADDRESS.MAX', default: '' }
    },
    notes: {
      type: 'string',
      vo: { name: 'ClientNotes', fieldName: 'Client notes', lengthRule: 'max', constraintKey: 'NOTES' },
      form: { control: 'textarea', label: 'Notas internas', section: 'notes', order: 1, rows: 3, fullWidth: true },
      column: { type: 'varchar', lengthConst: 'NOTES.MAX', default: '' }
    }
  },
  list: {
    deleteLabelField: 'name',
    defaultSort: { field: 'name', dir: 'asc' },
    features: { create: true, export: ['csv'], search: true, view: false, edit: true, delete: true }
  }
})
