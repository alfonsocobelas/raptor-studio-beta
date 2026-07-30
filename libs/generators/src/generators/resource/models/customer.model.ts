import { defineResource } from '@acc/schema'

// Faithful transcription of the golden reference module `customers`.
// Note (C2): its mapper uses a different style (VO .value reads + contacts composition),
// so the mapper is skipped for this resource.
export const customer = defineResource({
  schemaVersion: 1,
  name: 'customer',
  plural: 'customers',
  context: 'sap-licensing',
  schemaName: 'sap_licensing',
  route: '/sap-licensing/customers',
  sharedDomainAlias: '@sap-licenses/shared/domain',
  labels: { singular: 'Cliente', plural: 'Clientes', subtitle: 'Gestión de clientes SAP', gender: 'm' },
  formSections: [
    { id: 'general', title: 'Datos generales' },
    { id: 'notes', title: 'Notas' }
  ],
  constraintsConst: 'CUSTOMER_CONSTRAINTS',
  audit: true,
  skipEmit: ['mapper'],
  constraints: {
    SAP_ID: { MIN: 3, MAX: 20 },
    NAME: { shared: 'CUSTOMER_NAME' },
    TAX_ID: { MAX: 20 },
    INDUSTRY: { MAX: 100 },
    CITY: { MAX: 100 },
    COUNTRY: { MAX: 100 },
    ADDRESS: { MAX: 500 },
    PHONE: { shared: true },
    NOTES: { MAX: 1000 },
    MAX_CONTACTS: 20,
    CONTACT: { NAME: { MIN: 2, MAX: 200 }, ROLE: { MAX: 100 }, EMAIL: { MAX: 200 } }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    sapId: {
      type: 'string',
      unique: true,
      vo: {
        name: 'SapId',
        fieldName: 'SAP ID',
        ensure: 'string',
        noInnerWhitespace: true,
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'SAP_ID'
      },
      required: true,
      form: { control: 'text', label: 'ID SAP', section: 'general', order: 1 },
      query: { filterable: 2, sortable: 2 },
      column: { type: 'varchar', lengthConst: 'SAP_ID.MAX' }
    },
    name: {
      type: 'string',
      voShared: { name: 'CustomerName' },
      required: true,
      form: { control: 'text', label: 'Nombre', section: 'general', order: 2 },
      query: { filterable: 3, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Nombre', filterable: true, minWidth: 220 },
      column: { type: 'varchar', lengthConst: 'NAME.MAX' }
    },
    taxId: {
      type: 'string',
      unique: true,
      vo: { name: 'TaxId', fieldName: 'Tax ID', noInnerWhitespace: true, lengthRule: 'max', constraintKey: 'TAX_ID' },
      form: { control: 'text', label: 'CIF / NIF', section: 'general', order: 3 },
      query: { filterable: 4, sortable: 3, searchable: 3 },
      table: { show: true, order: 5, label: 'CIF / NIF', filterable: true, minWidth: 130 },
      column: { type: 'varchar', lengthConst: 'TAX_ID.MAX', default: '' }
    },
    industry: {
      type: 'string',
      vo: { name: 'CustomerIndustry', fieldName: 'Customer industry', lengthRule: 'max', constraintKey: 'INDUSTRY' },
      form: { control: 'text', label: 'Industria', section: 'general', order: 4 },
      query: { filterable: 5, sortable: 4, searchable: 2 },
      table: { show: true, order: 4, label: 'Industria', filterable: true, minWidth: 180 },
      column: { type: 'varchar', lengthConst: 'INDUSTRY.MAX', default: '' }
    },
    address: {
      type: 'string',
      vo: { name: 'CustomerAddress', fieldName: 'Customer address', lengthRule: 'max', constraintKey: 'ADDRESS' },
      form: { control: 'text', label: 'Dirección', section: 'general', order: 6 },
      query: { searchable: 4 },
      table: { show: true, order: 8, label: 'Dirección', sortable: false, minWidth: 250 },
      column: { type: 'varchar', lengthConst: 'ADDRESS.MAX', default: '' }
    },
    phone: {
      type: 'string',
      voShared: { name: 'Phone' },
      form: { control: 'text', label: 'Teléfono', section: 'general', order: 7 },
      query: { searchable: 5 },
      table: { show: true, order: 9, label: 'Teléfono', sortable: false, minWidth: 150 },
      column: { type: 'varchar', lengthConst: 'PHONE.MAX', default: '' }
    },
    notes: {
      type: 'string',
      vo: { name: 'CustomerNotes', fieldName: 'Customer notes', lengthRule: 'max', constraintKey: 'NOTES' },
      form: { control: 'textarea', label: 'Notas internas', section: 'notes', order: 8, rows: 3 },
      column: { type: 'varchar', lengthConst: 'NOTES.MAX', default: '' }
    },
    city: {
      type: 'string',
      optionalPrimitive: true,
      updatable: true,
      vo: { name: 'CustomerCity', fieldName: 'Customer city', lengthRule: 'max', constraintKey: 'CITY' },
      query: { sortable: 5, searchable: 6 },
      table: { show: true, order: 6, label: 'Localidad', minWidth: 150 },
      column: { type: 'varchar', lengthConst: 'CITY.MAX', default: '' }
    },
    country: {
      type: 'string',
      optionalPrimitive: true,
      updatable: true,
      vo: { name: 'CustomerCountry', fieldName: 'Customer country', lengthRule: 'max', constraintKey: 'COUNTRY' },
      query: { sortable: 6, searchable: 7 },
      table: { show: true, order: 7, label: 'País', minWidth: 150 },
      column: { type: 'varchar', lengthConst: 'COUNTRY.MAX', default: '' }
    },
    customerType: {
      type: 'string',
      required: true,
      vo: { name: 'CustomerType', fieldName: 'Customer type', values: ['cloud', 'onprem', 'hybrid'] },
      form: {
        control: 'select',
        label: 'Tipo',
        id: 'type',
        section: 'general',
        order: 5,
        placeholder: 'Seleccionar tipo',
        optionsType: 'CustomerClassification',
        options: [
          { value: 'cloud', label: 'Cloud' },
          { value: 'onprem', label: 'On-prem' },
          { value: 'hybrid', label: 'Hybrid' }
        ]
      },
      query: { filterable: 6, sortable: 7 },
      table: {
        show: true,
        order: 3,
        label: 'Tipo',
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          cloud: { label: 'Cloud', variant: 'default' },
          onprem: { label: 'On-prem', variant: 'secondary' },
          hybrid: { label: 'Hybrid', variant: 'outline' }
        }
      },
      column: { type: 'varchar', length: 10 }
    },
    status: {
      type: 'string',
      syncManaged: true,
      vo: { name: 'CustomerStatus', fieldName: 'Customer status', values: ['active', 'archived'] },
      table: {
        show: true,
        order: 2,
        label: 'Estado',
        sortable: false,
        minWidth: 120,
        type: 'badge',
        badgeMap: {
          active: { label: 'Activo', variant: 'outline' },
          archived: { label: 'Archivado', variant: 'secondary' }
        }
      },
      column: { type: 'varchar', length: 20, default: 'active' }
    },
    archivedAt: {
      type: 'timestamptz',
      nullable: true,
      syncManaged: true,
      voShared: { name: 'SyncTimestamp' },
      column: { type: 'timestamptz', tsType: 'Nullable<Date>' }
    },
    lastSeenInSyncAt: {
      type: 'timestamptz',
      nullable: true,
      syncManaged: true,
      voShared: { name: 'SyncTimestamp' },
      column: { type: 'timestamptz', tsType: 'Nullable<Date>' }
    }
  },
  composition: {
    name: 'contact',
    plural: 'contacts',
    parentField: 'customerId',
    maxConst: 'MAX_CONTACTS',
    primaryFlag: 'isPrimary',
    fields: {
      id: { type: 'uuid', vo: { name: 'ContactId', fieldName: 'Contact ID' } },
      name: {
        type: 'string',
        required: true,
        vo: {
          name: 'ContactName',
          fieldName: 'Contact name',
          ensure: 'string',
          minLength: true,
          lengthRule: 'max',
          constraintKey: 'CONTACT.NAME'
        }
      },
      role: { type: 'string', vo: { name: 'ContactRole', fieldName: 'Contact role', lengthRule: 'max', constraintKey: 'CONTACT.ROLE' } },
      email: {
        type: 'string',
        vo: { name: 'ContactEmail', fieldName: 'Contact email', lengthRule: 'max', email: true, constraintKey: 'CONTACT.EMAIL' }
      },
      phone: { type: 'string', voShared: { name: 'Phone' } },
      isPrimary: { type: 'boolean', vo: { name: 'IsPrimary', fieldName: 'Is primary' } }
    }
  }
})
