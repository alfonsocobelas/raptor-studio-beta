import { defineResource } from '@acc/schema'

// Faithful transcription of the golden reference entity:
// docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/
//   infrastructure/persistence/typeorm/typeorm-contract.entity.ts
// Pure data — no logic. The generator turns this into code.
export const contract = defineResource({
  schemaVersion: 1,
  name: 'contract',
  plural: 'contracts',
  context: 'sap-licensing',
  schemaName: 'sap_licensing',
  constraintsConst: 'CONTRACT_CONSTRAINTS',
  audit: true,
  auditComment: true,
  searchNotes: [
    'Free-text columns only: badge/enum columns (status, source…) store values that differ from their',
    'rendered labels, and numeric/date columns match inconsistently against what the user sees.'
  ],
  constraints: {
    CONTRACT_NUMBER: { shared: true },
    CUSTOMER_NAME: { shared: true },
    CMS_CASE_ID: { MAX: 30 },
    BUSINESS_MODEL: { MAX: 100 },
    CURRENCY: { LENGTH: 3 },
    TOTAL_VALUE: { MIN: 0 },
    NOTES: { MAX: 1000 },
    NBR_OF_CONTRACTS: { MIN: 0 },
    SUPPORT_MODEL: { MAX: 100 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    contractType: { type: 'string', query: { filterable: 2 }, column: { type: 'varchar', length: 20 } },
    contractNumber: {
      type: 'string',
      nullable: true,
      query: { filterable: 7, sortable: 1, searchable: 1 },
      comment: [
        'nullable a nivel de tipo desde spec 44 (maintenance: 36% de ISMaintenances sin ContractID);',
        'la columna física sigue NOT NULL hasta que la migración de la spec 44 la altere.'
      ],
      column: { type: 'varchar', lengthConst: 'CONTRACT_NUMBER.MAX', tsType: 'Nullable<string>' }
    },
    customerId: { type: 'uuid', query: { filterable: 5 }, relation: { to: 'customer', kind: 'reference' } },
    customerName: {
      type: 'string',
      query: { filterable: 6, sortable: 2, searchable: 2 },
      column: { type: 'varchar', lengthConst: 'CUSTOMER_NAME.MAX' }
    },
    cmsCaseId: {
      type: 'string',
      query: { searchable: 3 },
      column: { type: 'varchar', lengthConst: 'CMS_CASE_ID.MAX', default: '' }
    },
    businessModel: { type: 'string', column: { type: 'varchar', lengthConst: 'BUSINESS_MODEL.MAX', default: '' } },
    subSolutionAreas: {
      type: 'text',
      column: { type: 'text', array: true, defaultRaw: '"\'{}\'"', tsType: 'string[]' }
    },
    nbrOfContracts: { type: 'integer', column: { type: 'int', default: 1 } },
    isFavorite: { type: 'boolean', column: { type: 'boolean', default: false } },
    status: {
      type: 'string',
      query: { filterable: 3, sortable: 6 },
      column: { type: 'varchar', length: 20, default: 'active' }
    },
    source: {
      type: 'string',
      query: { filterable: 4 },
      column: { type: 'varchar', length: 20, default: 'AVVALE_SOLD' }
    },
    startDate: {
      type: 'date',
      nullable: true,
      query: { sortable: 3 },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    endDate: {
      type: 'date',
      nullable: true,
      query: { sortable: 4 },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    totalValue: {
      type: 'number',
      query: { sortable: 5 },
      column: { type: 'numeric', precision: 15, scale: 2, default: 0, transformer: 'numeric' }
    },
    currency: { type: 'string', column: { type: 'varchar', lengthConst: 'CURRENCY.LENGTH', default: 'EUR' } },
    billingFrequency: { type: 'string', column: { type: 'varchar', length: 20, default: 'yearly' } },
    renewalType: { type: 'string', column: { type: 'varchar', length: 20, default: 'manual' } },
    notes: { type: 'string', column: { type: 'varchar', lengthConst: 'NOTES.MAX', default: '' } },
    origin: {
      type: 'string',
      optionalPrimitive: true,
      comment: [
        'Origen y lifecycle sync (spec 44): origin distingue ME_SAP (gobernados por el sync) de MANUAL;',
        'lifecycleStatus/archivedAt/lastSeenInSyncAt son el eje de archivado por ausencia en los feeds.'
      ],
      column: { type: 'varchar', length: 20, default: 'MANUAL' }
    },
    lifecycleStatus: {
      type: 'string',
      optionalPrimitive: true,
      column: { type: 'varchar', length: 20, default: 'active' }
    },
    archivedAt: { type: 'timestamptz', nullable: true, column: { type: 'timestamptz', tsType: 'Nullable<Date>' } },
    lastSeenInSyncAt: {
      type: 'timestamptz',
      nullable: true,
      column: { type: 'timestamptz', tsType: 'Nullable<Date>' }
    },
    supportModel: {
      type: 'string',
      optionalPrimitive: true,
      comment: ['Campos maintenance (spec 44), solo poblados por el sync de ISMaintenances'],
      column: { type: 'varchar', lengthConst: 'SUPPORT_MODEL.MAX', default: '' }
    },
    upcomingMaintenanceEnd: {
      type: 'date',
      nullable: true,
      optionalPrimitive: true,
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    upcomingMaintenanceFee: {
      type: 'number',
      nullable: true,
      optionalPrimitive: true,
      column: { type: 'numeric', precision: 15, scale: 2, transformer: 'nullableNumeric', tsType: 'Nullable<number>' }
    }
  }
})
