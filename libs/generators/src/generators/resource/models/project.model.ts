import { defineResource } from '@acc/schema'

// Faithful transcription of the golden reference module `projects`.
// Canonical primitives-style mapper: all 5 files are emitted for this resource.
export const project = defineResource({
  schemaVersion: 1,
  name: 'project',
  plural: 'projects',
  context: 'sap-licensing',
  schemaName: 'sap_licensing',
  route: '/sap-licensing/projects',
  sharedDomainAlias: '@sap-licenses/shared/domain',
  labels: {
    singular: 'Proyecto',
    plural: 'Proyectos',
    subtitle: 'Proyectos de implementación SAP asociados a clientes',
    gender: 'm'
  },
  list: { features: { view: false, delete: true } },
  constraintsConst: 'PROJECT_CONSTRAINTS',
  audit: true,
  auditComment: true,
  softDelete: true,
  searchNotes: ['Free-text columns shown in the table (spec 25: status/implementer are badges, dates are out).'],
  constraints: {
    NAME: { MIN: 3, MAX: 200 },
    DESCRIPTION: { MAX: 1000 },
    SAP_PROJECT_ID: { MAX: 30 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    customerId: { type: 'uuid', query: { filterable: 4 }, relation: { to: 'customer', kind: 'reference' } },
    customerName: {
      type: 'string',
      query: { filterable: 5, sortable: 2, searchable: 2 },
      table: { show: true, order: 2, label: 'Cliente', filterable: true, minWidth: 200 },
      column: { type: 'varchar', length: 200 }
    },
    name: {
      type: 'string',
      query: { filterable: 6, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Nombre', filterable: true, minWidth: 250 },
      column: { type: 'varchar', lengthConst: 'NAME.MAX' }
    },
    description: { type: 'string', column: { type: 'varchar', lengthConst: 'DESCRIPTION.MAX', default: '' } },
    startDate: {
      type: 'date',
      nullable: true,
      query: { sortable: 3 },
      table: { show: true, order: 4, label: 'Fecha inicio', type: 'date', minWidth: 120 },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    endDate: {
      type: 'date',
      nullable: true,
      query: { sortable: 4 },
      table: { show: true, order: 5, label: 'Fecha fin', type: 'date', minWidth: 120 },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    status: {
      type: 'string',
      query: { filterable: 2, sortable: 5 },
      table: {
        show: true,
        order: 6,
        label: 'Estado',
        filterable: true,
        minWidth: 120,
        type: 'badge',
        badgeMap: {
          planning: { label: 'Planificación', variant: 'outline' },
          active: { label: 'Activo', variant: 'default' },
          onhold: { label: 'En pausa', variant: 'secondary' },
          closed: { label: 'Cerrado', variant: 'ghost' }
        }
      },
      column: { type: 'varchar', length: 20, default: 'planning' }
    },
    implementer: {
      type: 'string',
      query: { filterable: 3 },
      table: {
        show: true,
        order: 7,
        label: 'Implementador',
        filterable: true,
        minWidth: 130,
        type: 'badge',
        badgeMap: {
          AVVALE: { label: 'AVVALE', variant: 'default' },
          THIRD_PARTY: { label: 'Tercero', variant: 'secondary' }
        }
      },
      column: { type: 'varchar', length: 20, default: 'AVVALE' }
    },
    origin: {
      type: 'string',
      optionalPrimitive: true,
      query: { filterable: 7 },
      table: {
        show: true,
        order: 3,
        label: 'Origen',
        filterable: true,
        minWidth: 100,
        type: 'badge',
        badgeMap: {
          MANUAL: { label: 'Manual', variant: 'secondary' },
          ME_SAP: { label: 'SAP', variant: 'outline' }
        }
      },
      comment: [
        'Origen y lifecycle sync (spec 46): origin distingue ME_SAP (gobernados por el sync) de MANUAL;',
        'lifecycleStatus/archivedAt/lastSeenInSyncAt son el eje de archivado por ausencia en el feed.'
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
    sapProjectId: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      comment: ['Campos SAP (spec 46): identidad de upsert + crudo del feed, sin invariante propia.'],
      column: { type: 'varchar', lengthConst: 'SAP_PROJECT_ID.MAX', tsType: 'Nullable<string>' }
    },
    atRisk: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      column: { type: 'varchar', length: 50, tsType: 'Nullable<string>' }
    },
    inEscalation: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      column: { type: 'varchar', length: 50, tsType: 'Nullable<string>' }
    },
    nbrOfWaves: {
      type: 'integer',
      nullable: true,
      optionalPrimitive: true,
      column: { type: 'int', tsType: 'Nullable<number>' }
    },
    waveStage: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      column: { type: 'varchar', length: 50, tsType: 'Nullable<string>' }
    },
    waveStatus: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      column: { type: 'varchar', length: 50, tsType: 'Nullable<string>' }
    },
    planToGoLive: {
      type: 'date',
      nullable: true,
      optionalPrimitive: true,
      column: { type: 'date', tsType: 'Nullable<string>' }
    }
  }
})
