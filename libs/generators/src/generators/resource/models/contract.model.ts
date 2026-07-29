import { ResourceModel } from './model-types'

// Faithful transcription of the golden reference entity:
// docs/referencia/libs/backend/src/contexts/sap-licensing/modules/contracts/
//   infrastructure/persistence/typeorm/typeorm-contract.entity.ts
// Pure data — no logic. The generator turns this into code.
export const contract: ResourceModel = {
  name: 'contract',
  plural: 'contracts',
  context: 'sap-licensing',
  schemaName: 'sap_licensing',
  constraintsConst: 'CONTRACT_CONSTRAINTS',
  audit: true,
  fields: [
    { name: 'id', tsType: 'string', column: 'uuid', pk: true },
    { name: 'contractType', tsType: 'string', column: 'varchar', options: { length: 20 } },
    {
      name: 'contractNumber',
      tsType: 'Nullable<string>',
      column: 'varchar',
      comment: [
        'nullable a nivel de tipo desde spec 44 (maintenance: 36% de ISMaintenances sin ContractID);',
        'la columna física sigue NOT NULL hasta que la migración de la spec 44 la altere.'
      ],
      options: { lengthConst: 'CONTRACT_NUMBER.MAX', nullable: true }
    },
    { name: 'customerId', tsType: 'string', column: 'uuid' },
    { name: 'customerName', tsType: 'string', column: 'varchar', options: { lengthConst: 'CUSTOMER_NAME.MAX' } },
    {
      name: 'cmsCaseId',
      tsType: 'string',
      column: 'varchar',
      options: { lengthConst: 'CMS_CASE_ID.MAX', default: '' }
    },
    {
      name: 'businessModel',
      tsType: 'string',
      column: 'varchar',
      options: { lengthConst: 'BUSINESS_MODEL.MAX', default: '' }
    },
    { name: 'subSolutionAreas', tsType: 'string[]', column: 'text', options: { array: true, defaultRaw: '"\'{}\'"' } },
    { name: 'nbrOfContracts', tsType: 'number', column: 'int', options: { default: 1 } },
    { name: 'isFavorite', tsType: 'boolean', column: 'boolean', options: { default: false } },
    { name: 'status', tsType: 'string', column: 'varchar', options: { length: 20, default: 'active' } },
    { name: 'source', tsType: 'string', column: 'varchar', options: { length: 20, default: 'AVVALE_SOLD' } },
    { name: 'startDate', tsType: 'Nullable<string>', column: 'date', options: { nullable: true } },
    { name: 'endDate', tsType: 'Nullable<string>', column: 'date', options: { nullable: true } },
    {
      name: 'totalValue',
      tsType: 'number',
      column: 'numeric',
      options: { precision: 15, scale: 2, default: 0, transformer: 'numeric' }
    },
    {
      name: 'currency',
      tsType: 'string',
      column: 'varchar',
      options: { lengthConst: 'CURRENCY.LENGTH', default: 'EUR' }
    },
    { name: 'billingFrequency', tsType: 'string', column: 'varchar', options: { length: 20, default: 'yearly' } },
    { name: 'renewalType', tsType: 'string', column: 'varchar', options: { length: 20, default: 'manual' } },
    { name: 'notes', tsType: 'string', column: 'varchar', options: { lengthConst: 'NOTES.MAX', default: '' } },
    {
      name: 'origin',
      tsType: 'string',
      column: 'varchar',
      comment: [
        'Origen y lifecycle sync (spec 44): origin distingue ME_SAP (gobernados por el sync) de MANUAL;',
        'lifecycleStatus/archivedAt/lastSeenInSyncAt son el eje de archivado por ausencia en los feeds.'
      ],
      options: { length: 20, default: 'MANUAL' }
    },
    { name: 'lifecycleStatus', tsType: 'string', column: 'varchar', options: { length: 20, default: 'active' } },
    { name: 'archivedAt', tsType: 'Nullable<Date>', column: 'timestamptz', options: { nullable: true } },
    { name: 'lastSeenInSyncAt', tsType: 'Nullable<Date>', column: 'timestamptz', options: { nullable: true } },
    {
      name: 'supportModel',
      tsType: 'string',
      column: 'varchar',
      comment: ['Campos maintenance (spec 44), solo poblados por el sync de ISMaintenances'],
      options: { lengthConst: 'SUPPORT_MODEL.MAX', default: '' }
    },
    { name: 'upcomingMaintenanceEnd', tsType: 'Nullable<string>', column: 'date', options: { nullable: true } },
    {
      name: 'upcomingMaintenanceFee',
      tsType: 'Nullable<number>',
      column: 'numeric',
      options: { precision: 15, scale: 2, nullable: true, transformer: 'nullableNumeric' }
    }
  ]
}
