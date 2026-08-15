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
  brief: 'Un contrato de licencias con un cliente; su vigencia gobierna qué licencias están activas.',
  schemaName: 'sap_licensing',
  route: '/sap-licensing/contracts',
  sharedDomainAlias: '@sap-licenses/shared/domain',
  labels: {
    singular: 'Contrato',
    plural: 'Contratos',
    subtitle: 'Gestión de contratos SAP y acuerdos de licenciamiento',
    gender: 'm'
  },
  list: { viewLabel: 'Ver detalle' },
  labelsModule: true,
  formSections: [
    { id: 'contract', title: 'Datos del contrato' },
    { id: 'notes', title: 'Notas' }
  ],
  formGroupValidators: [{ kind: 'dateRange', startField: 'startDate', endField: 'endDate' }],
  period: { start: 'startDate', end: 'endDate' },
  // Cronograma (spec 30): las vigencias de contrato dibujadas como barras
  gantt: {},
  // Ficha (spec 16): los botones de transición de la spec 43 viven en su cabecera
  detail: {},
  // Máquina de estados (spec 43): status promovido — ejercita from múltiple (terminate)
  // y simple (expire). La regla es la flecha que NO existe: un terminated no revive.
  state: {
    field: 'status',
    initial: 'active',
    transitions: [
      { name: 'terminate', label: 'Terminar', from: ['active', 'expiring'], to: 'terminated' },
      { name: 'expire', label: 'Expirar', from: ['expiring'], to: 'expired' }
    ]
  },
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
    contractType: {
      required: true,
      vo: { name: 'ContractType', fieldName: 'Contract type', values: ['cloud', 'onprem', 'mixed', 'maintenance'] },
      type: 'string',
      query: { filterable: 2 },
      table: {
        show: true,
        order: 3,
        label: 'Tipo',
        filterable: true,
        sortable: false,
        minWidth: 110,
        type: 'badge',
        badgeMap: {
          cloud: { label: 'Cloud', variant: 'default' },
          onprem: { label: 'On-premise', variant: 'secondary' },
          mixed: { label: 'Mixto', variant: 'outline' },
          maintenance: { label: 'Mantenimiento', variant: 'outline' }
        }
      },
      form: {
        control: 'select',
        label: 'Tipo',
        id: 'type',
        section: 'contract',
        order: 3,
        optionsType: 'ContractTypeEnum',
        default: 'ContractTypeEnum.CLOUD',
        labelsConst: 'CONTRACT_TYPE_LABELS',
        options: [
          { value: 'cloud', label: 'Cloud' },
          { value: 'onprem', label: 'On-premise' }
        ]
      },
      column: { type: 'varchar', length: 20 }
    },
    contractNumber: {
      type: 'string',
      nullable: true,
      voShared: { name: 'ContractNumber' },
      unique: true,
      query: { filterable: 7, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Nº Contrato', filterable: true, minWidth: 180 },
      required: true,
      form: { control: 'text', label: 'Nº Contrato', id: 'num', section: 'contract', order: 2 },
      comment: [
        'nullable a nivel de tipo desde spec 44 (maintenance: 36% de ISMaintenances sin ContractID);',
        'la columna física sigue NOT NULL hasta que la migración de la spec 44 la altere.'
      ],
      column: { type: 'varchar', lengthConst: 'CONTRACT_NUMBER.MAX', tsType: 'Nullable<string>' }
    },
    customerId: {
      type: 'uuid',
      required: true,
      query: { filterable: 5 },
      relation: { to: 'customer', kind: 'reference' },
      form: {
        control: 'select',
        label: 'Cliente',
        id: 'cust',
        section: 'contract',
        order: 4,
        placeholder: 'Seleccionar cliente',
        lookup: { resource: 'customer', labelField: 'name', denormalizes: 'customerName' }
      }
    },
    customerName: {
      type: 'string',
      required: true,
      voShared: { name: 'CustomerName' },
      query: { filterable: 6, sortable: 2, searchable: 2 },
      table: { show: true, order: 2, label: 'Cliente', filterable: true, minWidth: 200 },
      column: { type: 'varchar', lengthConst: 'CUSTOMER_NAME.MAX' }
    },
    cmsCaseId: {
      vo: { name: 'CmsCaseId', fieldName: 'CMS case ID', noInnerWhitespace: true, lengthRule: 'max' },
      type: 'string',
      query: { searchable: 3 },
      column: { type: 'varchar', lengthConst: 'CMS_CASE_ID.MAX', default: '' }
    },
    businessModel: {
      vo: { name: 'BusinessModel', fieldName: 'Business model', lengthRule: 'max' },
      type: 'string',
      column: { type: 'varchar', lengthConst: 'BUSINESS_MODEL.MAX', default: '' }
    },
    subSolutionAreas: {
      vo: { name: 'SubSolutionAreas', fieldName: 'Sub solution areas' },
      type: 'text',
      column: { type: 'text', array: true, defaultRaw: '"\'{}\'"', tsType: 'string[]' }
    },
    nbrOfContracts: {
      vo: { name: 'NumberOfContracts', fieldName: 'Number of contracts', min: true, constraintKey: 'NBR_OF_CONTRACTS' },
      type: 'integer',
      column: { type: 'int', default: 1 }
    },
    isFavorite: {
      vo: { name: 'IsFavorite', fieldName: 'Is favorite' },
      type: 'boolean',
      form: { control: 'checkbox', label: 'Marcar como favorito', section: 'contract', order: 12 },
      column: { type: 'boolean', default: false }
    },
    status: {
      vo: {
        name: 'ContractStatus',
        fieldName: 'Contract status',
        values: ['active', 'expiring', 'expired', 'terminated']
      },
      type: 'string',
      query: { filterable: 3, sortable: 6 },
      table: {
        show: true,
        order: 6,
        label: 'Estado',
        filterable: true,
        minWidth: 120,
        type: 'badge',
        badgeMap: {
          active: { label: 'Activo', variant: 'default' },
          expiring: { label: 'Por expirar', variant: 'outline' },
          expired: { label: 'Expirado', variant: 'secondary' },
          terminated: { label: 'Terminado', variant: 'destructive' }
        }
      },
      form: {
        control: 'select',
        label: 'Estado',
        id: 'status',
        section: 'contract',
        order: 7,
        optionsType: 'ContractStatusEnum',
        default: 'ContractStatusEnum.ACTIVE',
        labelsConst: 'CONTRACT_STATUS_LABELS',
        options: [
          { value: 'active', label: 'Activo' },
          { value: 'expiring', label: 'Por expirar' },
          { value: 'expired', label: 'Expirado' },
          { value: 'terminated', label: 'Terminado' }
        ]
      },
      column: { type: 'varchar', length: 20, default: 'active' }
    },
    source: {
      vo: { name: 'ContractSource', fieldName: 'Contract source', values: ['AVVALE_SOLD', 'CUSTOMER_OWNED'] },
      type: 'string',
      query: { filterable: 4 },
      form: {
        control: 'select',
        label: 'Origen',
        id: 'source',
        section: 'contract',
        order: 11,
        optionsType: 'ContractSourceEnum',
        default: 'ContractSourceEnum.AVVALE_SOLD',
        labelsConst: 'CONTRACT_SOURCE_LABELS',
        options: [
          { value: 'AVVALE_SOLD', label: 'Vendido por Avvale' },
          { value: 'CUSTOMER_OWNED', label: 'Propiedad del cliente' }
        ]
      },
      column: { type: 'varchar', length: 20, default: 'AVVALE_SOLD' }
    },
    startDate: {
      type: 'date',
      nullable: true,
      voShared: { name: 'ContractDate' },
      // filterable desde la spec 32: la serie mensual del dashboard cuenta por rangos de inicio
      query: { sortable: 3, filterable: true },
      table: { show: true, order: 4, label: 'Inicio', type: 'date', minWidth: 120 },
      required: true,
      form: { control: 'date', label: 'Fecha inicio', id: 'start', section: 'contract', order: 5 },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    endDate: {
      type: 'date',
      nullable: true,
      voShared: { name: 'ContractDate' },
      query: { sortable: 4 },
      table: { show: true, order: 5, label: 'Fin', type: 'date', minWidth: 120 },
      form: {
        control: 'date',
        label: 'Fecha fin',
        id: 'end',
        section: 'contract',
        order: 6,
        groupErrorMessage: 'La fecha fin debe ser posterior a la de inicio'
      },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    totalValue: {
      vo: { name: 'ContractValue', fieldName: 'Contract value', min: true, constraintKey: 'TOTAL_VALUE', unset: true },
      type: 'number',
      query: { sortable: 5 },
      table: { show: true, order: 7, label: 'Valor total', type: 'number', minWidth: 140 },
      column: { type: 'numeric', precision: 15, scale: 2, default: 0, transformer: 'numeric' }
    },
    currency: {
      vo: {
        name: 'ContractCurrency',
        fieldName: 'Contract currency',
        ensure: 'string',
        noInnerWhitespace: true,
        lengthRule: 'exact',
        lengthMessage: 'Contract currency must be a ${CONTRACT_CONSTRAINTS.CURRENCY.LENGTH}-letter ISO code',
        constraintKey: 'CURRENCY'
      },
      type: 'string',
      form: { control: 'text', label: 'Moneda', id: 'currency', section: 'contract', order: 8, default: "'EUR'" },
      column: { type: 'varchar', lengthConst: 'CURRENCY.LENGTH', default: 'EUR' }
    },
    billingFrequency: {
      vo: {
        name: 'BillingFrequency',
        fieldName: 'Billing frequency',
        values: ['monthly', 'quarterly', 'semiannual', 'yearly']
      },
      type: 'string',
      table: {
        show: true,
        order: 9,
        label: 'Facturación',
        sortable: false,
        minWidth: 120,
        valueMapConst: 'BILLING_FREQUENCY_LABELS'
      },
      form: {
        control: 'select',
        label: 'Facturación',
        id: 'billing',
        section: 'contract',
        order: 9,
        optionsType: 'BillingFrequencyEnum',
        default: 'BillingFrequencyEnum.YEARLY',
        labelsConst: 'BILLING_FREQUENCY_LABELS',
        options: [
          { value: 'monthly', label: 'Mensual' },
          { value: 'quarterly', label: 'Trimestral' },
          { value: 'semiannual', label: 'Semestral' },
          { value: 'yearly', label: 'Anual' }
        ]
      },
      column: { type: 'varchar', length: 20, default: 'yearly' }
    },
    renewalType: {
      vo: { name: 'RenewalType', fieldName: 'Renewal type', values: ['auto', 'manual', 'none'] },
      type: 'string',
      form: {
        control: 'select',
        label: 'Renovación',
        id: 'renewal',
        section: 'contract',
        order: 10,
        optionsType: 'RenewalTypeEnum',
        default: 'RenewalTypeEnum.MANUAL',
        labelsConst: 'RENEWAL_TYPE_LABELS',
        options: [
          { value: 'auto', label: 'Automática' },
          { value: 'manual', label: 'Manual' },
          { value: 'none', label: 'Sin renovación' }
        ]
      },
      column: { type: 'varchar', length: 20, default: 'manual' }
    },
    notes: {
      vo: { name: 'ContractNotes', fieldName: 'Contract notes', lengthRule: 'max', constraintKey: 'NOTES' },
      type: 'string',
      form: { control: 'textarea', label: 'Notas internas', id: 'notes', section: 'notes', order: 13, rows: 3 },
      column: { type: 'varchar', lengthConst: 'NOTES.MAX', default: '' }
    },
    origin: {
      syncManaged: true,
      vo: { name: 'ContractOrigin', fieldName: 'Contract origin', values: ['ME_SAP', 'MANUAL'] },
      type: 'string',
      optionalPrimitive: true,
      comment: [
        'Origen y lifecycle sync (spec 44): origin distingue ME_SAP (gobernados por el sync) de MANUAL;',
        'lifecycleStatus/archivedAt/lastSeenInSyncAt son el eje de archivado por ausencia en los feeds.'
      ],
      column: { type: 'varchar', length: 20, default: 'MANUAL' }
    },
    lifecycleStatus: {
      syncManaged: true,
      vo: { name: 'ContractLifecycleStatus', fieldName: 'Contract lifecycle status', values: ['active', 'archived'] },
      type: 'string',
      optionalPrimitive: true,
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
    },
    supportModel: {
      vo: { name: 'SupportModel', fieldName: 'Support model', lengthRule: 'max' },
      type: 'string',
      optionalPrimitive: true,
      comment: ['Campos maintenance (spec 44), solo poblados por el sync de ISMaintenances'],
      column: { type: 'varchar', lengthConst: 'SUPPORT_MODEL.MAX', default: '' }
    },
    upcomingMaintenanceEnd: {
      type: 'date',
      nullable: true,
      optionalPrimitive: true,
      voShared: { name: 'ContractDate', unset: true },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    upcomingMaintenanceFee: {
      type: 'number',
      nullable: true,
      optionalPrimitive: true,
      voRef: { name: 'ContractValue', unset: true },
      column: { type: 'numeric', precision: 15, scale: 2, transformer: 'nullableNumeric', tsType: 'Nullable<number>' }
    }
  }
})
