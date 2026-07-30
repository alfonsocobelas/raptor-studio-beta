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
      vo: 'SapId',
      query: { filterable: 2, sortable: 2 },
      column: { type: 'varchar', lengthConst: 'SAP_ID.MAX' }
    },
    name: {
      type: 'string',
      vo: 'CustomerName',
      query: { filterable: 3, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Nombre', filterable: true, minWidth: 220 },
      column: { type: 'varchar', lengthConst: 'NAME.MAX' }
    },
    taxId: {
      type: 'string',
      unique: true,
      vo: 'TaxId',
      query: { filterable: 4, sortable: 3, searchable: 3 },
      table: { show: true, order: 5, label: 'CIF / NIF', filterable: true, minWidth: 130 },
      column: { type: 'varchar', lengthConst: 'TAX_ID.MAX', default: '' }
    },
    industry: {
      type: 'string',
      query: { filterable: 5, sortable: 4, searchable: 2 },
      table: { show: true, order: 4, label: 'Industria', filterable: true, minWidth: 180 },
      column: { type: 'varchar', lengthConst: 'INDUSTRY.MAX', default: '' }
    },
    address: {
      type: 'string',
      query: { searchable: 4 },
      table: { show: true, order: 8, label: 'Dirección', sortable: false, minWidth: 250 },
      column: { type: 'varchar', lengthConst: 'ADDRESS.MAX', default: '' }
    },
    phone: {
      type: 'string',
      query: { searchable: 5 },
      table: { show: true, order: 9, label: 'Teléfono', sortable: false, minWidth: 150 },
      column: { type: 'varchar', lengthConst: 'PHONE.MAX', default: '' }
    },
    notes: { type: 'string', column: { type: 'varchar', lengthConst: 'NOTES.MAX', default: '' } },
    city: {
      type: 'string',
      query: { sortable: 5, searchable: 6 },
      table: { show: true, order: 6, label: 'Localidad', minWidth: 150 },
      column: { type: 'varchar', lengthConst: 'CITY.MAX', default: '' }
    },
    country: {
      type: 'string',
      query: { sortable: 6, searchable: 7 },
      table: { show: true, order: 7, label: 'País', minWidth: 150 },
      column: { type: 'varchar', lengthConst: 'COUNTRY.MAX', default: '' }
    },
    customerType: {
      type: 'string',
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
    archivedAt: { type: 'timestamptz', nullable: true, column: { type: 'timestamptz', tsType: 'Nullable<Date>' } },
    lastSeenInSyncAt: { type: 'timestamptz', nullable: true, column: { type: 'timestamptz', tsType: 'Nullable<Date>' } }
  }
})
