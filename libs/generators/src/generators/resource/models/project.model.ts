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
  // spec 25: la ficha es donde viven los documentos del proyecto, y el schema exige la acción
  // «ver» en el listado para que sea alcanzable
  list: { features: { view: true, delete: true } },
  detail: {},
  attachments: true,
  period: { start: 'startDate', end: 'endDate' },
  formSections: [{ id: 'general', title: 'Datos generales' }],
  formGroupValidators: [{ kind: 'dateRange', startField: 'startDate', endField: 'endDate' }],
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
    customerId: {
      type: 'uuid',
      required: true,
      query: { filterable: 4 },
      relation: { to: 'customer', kind: 'reference' },
      form: {
        control: 'select',
        label: 'Cliente',
        id: 'customer',
        section: 'general',
        order: 3,
        placeholder: 'Seleccionar cliente',
        lookup: { resource: 'customer', labelField: 'name', denormalizes: 'customerName' }
      }
    },
    customerName: {
      type: 'string',
      required: true,
      voShared: { name: 'CustomerName' },
      query: { filterable: 5, sortable: 2, searchable: 2 },
      table: { show: true, order: 2, label: 'Cliente', filterable: true, minWidth: 200 },
      column: { type: 'varchar', length: 200 }
    },
    name: {
      type: 'string',
      unique: true,
      vo: {
        name: 'ProjectName',
        fieldName: 'Project name',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'NAME'
      },
      query: { filterable: 6, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Nombre', filterable: true, minWidth: 250 },
      required: true,
      form: { control: 'text', label: 'Nombre', section: 'general', order: 1, maxLength: 200, fullWidth: true },
      column: { type: 'varchar', lengthConst: 'NAME.MAX' }
    },
    description: {
      type: 'string',
      vo: {
        name: 'ProjectDescription',
        fieldName: 'Project description',
        lengthRule: 'max',
        constraintKey: 'DESCRIPTION'
      },
      form: {
        control: 'textarea',
        label: 'Descripción',
        id: 'desc',
        section: 'general',
        order: 2,
        rows: 3,
        fullWidth: true
      },
      column: { type: 'varchar', lengthConst: 'DESCRIPTION.MAX', default: '' }
    },
    startDate: {
      type: 'date',
      nullable: true,
      voShared: { name: 'ContractDate' },
      query: { sortable: 3 },
      table: { show: true, order: 4, label: 'Fecha inicio', type: 'date', minWidth: 120 },
      required: true,
      form: { control: 'date', label: 'Fecha inicio', id: 'start', section: 'general', order: 5 },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    endDate: {
      type: 'date',
      nullable: true,
      voShared: { name: 'ContractDate' },
      query: { sortable: 4 },
      table: { show: true, order: 5, label: 'Fecha fin', type: 'date', minWidth: 120 },
      form: {
        control: 'date',
        label: 'Fecha fin',
        id: 'end',
        section: 'general',
        order: 6,
        groupErrorMessage: 'La fecha fin debe ser posterior a la de inicio'
      },
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    status: {
      type: 'string',
      vo: { name: 'ProjectStatus', fieldName: 'Project status', values: ['planning', 'active', 'onhold', 'closed'] },
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
      form: {
        control: 'select',
        label: 'Estado',
        id: 'status',
        section: 'general',
        order: 4,
        optionsType: 'ProjectStatusEnum',
        default: 'ProjectStatusEnum.PLANNING',
        options: [
          { value: 'planning', label: 'Planificación' },
          { value: 'active', label: 'Activo' },
          { value: 'onhold', label: 'En pausa' },
          { value: 'closed', label: 'Cerrado' }
        ]
      },
      column: { type: 'varchar', length: 20, default: 'planning' }
    },
    implementer: {
      type: 'string',
      vo: { name: 'ProjectImplementer', fieldName: 'Project implementer', values: ['AVVALE', 'THIRD_PARTY'] },
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
      form: {
        control: 'select',
        label: 'Implementador',
        id: 'impl',
        section: 'general',
        order: 7,
        optionsType: 'ProjectImplementerEnum',
        default: 'ProjectImplementerEnum.AVVALE',
        options: [
          { value: 'AVVALE', label: 'AVVALE' },
          { value: 'THIRD_PARTY', label: 'Tercero' }
        ]
      },
      column: { type: 'varchar', length: 20, default: 'AVVALE' }
    },
    origin: {
      type: 'string',
      syncManaged: true,
      vo: { name: 'ProjectOrigin', fieldName: 'Project origin', values: ['MANUAL', 'ME_SAP'] },
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
      syncManaged: true,
      vo: { name: 'ProjectLifecycleStatus', fieldName: 'Project lifecycle status', values: ['active', 'archived'] },
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
    sapProjectId: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      omitAtRegister: true,
      vo: {
        name: 'SapProjectId',
        fieldName: 'SAP project ID',
        ensure: 'string',
        noInnerWhitespace: true,
        lengthRule: 'max',
        constraintKey: 'SAP_PROJECT_ID'
      },
      comment: ['Campos SAP (spec 46): identidad de upsert + crudo del feed, sin invariante propia.'],
      column: { type: 'varchar', lengthConst: 'SAP_PROJECT_ID.MAX', tsType: 'Nullable<string>' }
    },
    atRisk: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      omitAtRegister: true,
      column: { type: 'varchar', length: 50, tsType: 'Nullable<string>' }
    },
    inEscalation: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      omitAtRegister: true,
      column: { type: 'varchar', length: 50, tsType: 'Nullable<string>' }
    },
    nbrOfWaves: {
      type: 'integer',
      nullable: true,
      optionalPrimitive: true,
      omitAtRegister: true,
      column: { type: 'int', tsType: 'Nullable<number>' }
    },
    waveStage: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      omitAtRegister: true,
      column: { type: 'varchar', length: 50, tsType: 'Nullable<string>' }
    },
    waveStatus: {
      type: 'string',
      nullable: true,
      optionalPrimitive: true,
      omitAtRegister: true,
      column: { type: 'varchar', length: 50, tsType: 'Nullable<string>' }
    },
    planToGoLive: {
      type: 'date',
      nullable: true,
      optionalPrimitive: true,
      omitAtRegister: true,
      voShared: { name: 'ContractDate' },
      column: { type: 'date', tsType: 'Nullable<string>' }
    }
  }
})
