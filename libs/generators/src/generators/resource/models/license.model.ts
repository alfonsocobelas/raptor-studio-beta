import { defineResource } from '@acc/schema'

// Faithful transcription of the golden reference module `licenses` (the richest one:
// consumption snapshot columns, soft delete, observability thresholds).
// Note (C2): its mapper carries consumption-record composition methods, so it is skipped.
export const license = defineResource({
  schemaVersion: 1,
  name: 'license',
  plural: 'licenses',
  context: 'sap-licensing',
  schemaName: 'sap_licensing',
  route: '/sap-licensing/licenses',
  sharedDomainAlias: '@sap-licenses/shared/domain',
  dtoName: 'LicenseWithConsumptionDto',
  labels: {
    singular: 'Licencia',
    plural: 'Licencias',
    subtitle: 'Observabilidad del parque de licencias SAP',
    gender: 'f'
  },
  list: {
    viewLabel: 'Ver detalle',
    features: { edit: false },
    virtualColumns: {
      consumptionPctFmt: { show: true, order: 7, label: '% Consumo', sortable: false, minWidth: 110 },
      healthStatus: {
        show: true,
        order: 8,
        label: 'Estado salud',
        sortable: false,
        minWidth: 150,
        type: 'badge',
        badgeMap: {
          healthy: { label: 'Saludable', variant: 'default' },
          underused: { label: 'Infrautilizada', variant: 'outline' },
          overused: { label: 'Sobreuso', variant: 'secondary' },
          contractual_breach: { label: 'Infracción', variant: 'destructive' }
        }
      }
    }
  },
  constraintsConst: 'LICENSE_CONSTRAINTS',
  audit: true,
  softDelete: true,
  skipEmit: ['mapper'],
  ordersNotes: ['Allowlist única (spec 26): con el snapshot en columnas, todas las vistas ordenan en SQL.'],
  searchNotes: [
    'Free-text columns shown in the table (spec 25). The SQL path ORs them with ILIKE; the health',
    'path applies the same fields in memory (see filter-licenses-by-search.ts).'
  ],
  constraints: {
    METRIC_ID: { MAX: 20 },
    METRIC_NAME: { MAX: 200 },
    SUB_SOLUTION_AREA_NAME: { MAX: 150 },
    CUSTOMER_NAME: { shared: true },
    CONTRACT_NUMBER: { shared: true },
    LICENSED_UNITS: { MIN: 1 },
    PRICE_PER_UNIT: { MIN: 0 },
    ANNUAL_VALUE: { MIN: 0 },
    PERIOD_MONTH: { MIN: 1, MAX: 12 }
  },
  extraConstants: {
    OBSERVABILITY_THRESHOLDS: { UNDERUSED_PCT: 40, OVERUSED_PCT: 95, CONTRACTUAL_BREACH_PCT: 100 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    contractId: { type: 'uuid', query: { filterable: 2 }, relation: { to: 'contract', kind: 'reference' } },
    customerId: { type: 'uuid', query: { filterable: 3 }, relation: { to: 'customer', kind: 'reference' } },
    customerName: {
      type: 'string',
      query: { filterable: 4, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Cliente', filterable: true, minWidth: 200 },
      column: { type: 'varchar', lengthConst: 'CUSTOMER_NAME.MAX' }
    },
    contractNumber: {
      type: 'string',
      table: { show: true, order: 3, label: 'Contrato', sortable: false, minWidth: 180 },
      column: { type: 'varchar', lengthConst: 'CONTRACT_NUMBER.MAX' }
    },
    contractEndDate: {
      type: 'date',
      nullable: true,
      query: { sortable: 8 },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    metricId: { type: 'string', column: { type: 'varchar', lengthConst: 'METRIC_ID.MAX', default: '' } },
    metricName: { type: 'string', column: { type: 'varchar', lengthConst: 'METRIC_NAME.MAX' } },
    subSolutionAreaName: {
      type: 'string',
      query: { filterable: 7, sortable: 2, searchable: 2 },
      table: { show: true, order: 2, label: 'Solución', filterable: true, minWidth: 200 },
      column: { type: 'varchar', lengthConst: 'SUB_SOLUTION_AREA_NAME.MAX', default: '' }
    },
    metric: {
      type: 'string',
      query: { filterable: 6, searchable: 3 },
      table: { show: true, order: 4, label: 'Métrica', filterable: true, sortable: false, minWidth: 100 },
      column: { type: 'varchar', length: 20 }
    },
    licensedUnits: {
      type: 'integer',
      query: { sortable: 3 },
      table: { show: true, order: 5, label: 'Licenciadas', type: 'number', minWidth: 120 },
      column: { type: 'int' }
    },
    pricePerUnit: {
      type: 'number',
      column: { type: 'numeric', precision: 15, scale: 2, default: 0, transformer: 'numeric' }
    },
    status: { type: 'string', query: { filterable: 5 }, column: { type: 'varchar', length: 20, default: 'active' } },
    source: {
      type: 'string',
      optionalPrimitive: true,
      comment: [
        'Origen y lifecycle SAP (spec 33): source distingue ME_SAP (gobernadas por el sync) de MANUAL;',
        'lifecycleStatus/archivedAt/lastSeenInSyncAt son el eje de archivado por ausencia del material.'
      ],
      column: { type: 'varchar', length: 20, default: 'MANUAL' }
    },
    materialId: { type: 'string', optionalPrimitive: true, column: { type: 'varchar', length: 40, default: '' } },
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
    currentUnits: {
      type: 'number',
      query: { sortable: 4 },
      table: { show: true, order: 6, label: 'Consumo actual', type: 'number', sortable: false, minWidth: 130 },
      comment: [
        'Snapshot de consumo denormalizado (spec 26): lo recalcula recomputeConsumptionSnapshot en cada',
        'escritura de consumos; nunca se escribe desde el dominio.'
      ],
      column: { type: 'numeric', precision: 15, scale: 2, default: 0, transformer: 'numeric' }
    },
    consumptionPct: {
      type: 'number',
      query: {
        filterable: 8,
        sortable: 5,
        filterNote: ['Columna snapshot (spec 26): habilita el filtro de salud traducido a rango y el filtrado directo.']
      },
      column: { type: 'numeric', precision: 8, scale: 2, default: 0, transformer: 'numeric' }
    },
    excessUnits: {
      type: 'number',
      query: { sortable: 7 },
      column: { type: 'numeric', precision: 15, scale: 2, default: 0, transformer: 'numeric' }
    },
    annualValue: {
      type: 'number',
      query: { sortable: 6 },
      column: { type: 'numeric', precision: 15, scale: 2, default: 0, transformer: 'numeric' }
    }
  }
})
