import { defineResource } from '@raptor/schema'

// Demo model (Solaris Energía): la obra, de presupuesto a legalización.
// Es el modelo más cargado del registro a propósito — reúne en una sola entidad el código de
// negocio (spec 19), el cronograma (spec 30), el historial (spec 31), los adjuntos (spec 14),
// la ficha (spec 16) y la papelera (spec 29): si el generador falla en una, la demo lo canta.
export const installation = defineResource({
  schemaVersion: 1,
  name: 'installation',
  plural: 'installations',
  context: 'solaris',
  brief:
    'La obra: lleva código propio asignado por el sistema, fechas previstas para el cronograma y acumula los documentos que la legalizan (plano, memoria, CIE y certificado).',
  schemaName: 'solaris',
  route: '/solaris/installations',
  sharedDomainAlias: '@solaris/shared/domain',
  labels: {
    singular: 'Instalación',
    plural: 'Instalaciones',
    subtitle: 'Las obras, de presupuesto a legalización',
    gender: 'f'
  },
  formSections: [
    { id: 'general', title: 'Datos de la obra' },
    { id: 'planning', title: 'Planificación' }
  ],
  formGroupValidators: [{ kind: 'dateRange', startField: 'startDate', endField: 'endDate' }],
  constraintsConst: 'INSTALLATION_CONSTRAINTS',
  audit: true,
  softDelete: true,
  detail: {},
  attachments: true,
  history: true,
  code: { prefix: 'INS', padding: 4 },
  period: { start: 'startDate', end: 'endDate' },
  gantt: {},
  constraints: {
    ACCOUNT_NAME: { MAX: 200 },
    ADDRESS: { MIN: 3, MAX: 300 },
    TOWN: { MAX: 120 },
    POWER: { MIN: 0 },
    PANELS: { MIN: 0 },
    BUDGET: { MIN: 0 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    accountId: {
      type: 'uuid',
      required: true,
      query: { filterable: 2 },
      relation: { to: 'account', kind: 'reference' },
      form: {
        control: 'select',
        label: 'Cliente',
        id: 'account',
        section: 'general',
        order: 1,
        placeholder: 'Seleccionar cliente',
        lookup: { resource: 'account', labelField: 'name', denormalizes: 'accountName' }
      }
    },
    accountName: {
      type: 'string',
      required: true,
      vo: {
        name: 'InstallationAccountName',
        fieldName: 'Account name',
        ensure: 'string',
        lengthRule: 'max',
        constraintKey: 'ACCOUNT_NAME'
      },
      query: { filterable: 3, sortable: 1, searchable: 1 },
      table: { show: true, order: 2, label: 'Cliente', filterable: true, minWidth: 220 },
      samples: [
        'Cerámicas Duero S.L.',
        'Comunidad de Propietarios Plaza Mayor 7',
        'Marta Ruiz Alonso',
        'Agroganadera del Pisuerga S.A.',
        'Javier Peña Soto',
        'Bodegas Valdehierro S.L.',
        'Comunidad de Propietarios Ronda Sur 12',
        'Elena Cortés Vidal',
        'Transportes Arlanza S.L.',
        'Talleres Nieto e Hijos S.L.'
      ],
      column: { type: 'varchar', lengthConst: 'ACCOUNT_NAME.MAX' }
    },
    address: {
      type: 'string',
      required: true,
      vo: {
        name: 'InstallationAddress',
        fieldName: 'Installation address',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'ADDRESS'
      },
      form: { control: 'text', label: 'Dirección', section: 'general', order: 2, fullWidth: true },
      query: { searchable: 2 },
      table: { show: true, order: 3, label: 'Dirección', sortable: false, minWidth: 240 },
      samples: [
        'Pol. Ind. San Cristóbal, nave 14',
        'Plaza Mayor 7',
        'C/ Colmenares 22',
        'Ctra. Burgos km 8',
        'C/ Ancha 9',
        'Camino de la Vega s/n',
        'Ronda Sur 12',
        'Av. de Portugal 45',
        'Pol. Ind. Villalonquéjar, parc. 31',
        'C/ Herreros 4'
      ],
      column: { type: 'varchar', lengthConst: 'ADDRESS.MAX' }
    },
    town: {
      type: 'string',
      required: true,
      vo: { name: 'InstallationTown', fieldName: 'Town', lengthRule: 'max', constraintKey: 'TOWN' },
      form: { control: 'text', label: 'Municipio', section: 'general', order: 3 },
      query: { filterable: 4, sortable: 2, searchable: 3 },
      table: { show: true, order: 4, label: 'Municipio', filterable: true, minWidth: 150 },
      samples: [
        'Valladolid',
        'Burgos',
        'Salamanca',
        'Dueñas',
        'Astorga',
        'Tudela de Duero',
        'Zamora',
        'Segovia',
        'Burgos',
        'El Burgo de Osma'
      ],
      column: { type: 'varchar', lengthConst: 'TOWN.MAX', default: '' }
    },
    power: {
      type: 'number',
      required: true,
      vo: { name: 'InstallationPower', fieldName: 'Installed power', min: true, constraintKey: 'POWER' },
      form: { control: 'number', label: 'Potencia (kWp)', section: 'general', order: 4 },
      query: { sortable: 3 },
      table: { show: true, order: 5, label: 'kWp', type: 'number', minWidth: 100 },
      samples: [98.5, 24.2, 5.4, 145, 6.6, 62.7, 31.9, 4.8, 210.4, 15.3],
      column: { type: 'numeric', precision: 10, scale: 2, default: 0, transformer: 'numeric' }
    },
    panels: {
      type: 'integer',
      required: true,
      vo: { name: 'InstallationPanels', fieldName: 'Number of panels', min: true, constraintKey: 'PANELS' },
      form: { control: 'number', label: 'Nº de paneles', section: 'general', order: 5 },
      query: { sortable: 4 },
      samples: [178, 44, 10, 262, 12, 114, 58, 9, 380, 28],
      column: { type: 'int', default: 0 }
    },
    budget: {
      type: 'number',
      required: true,
      vo: { name: 'InstallationBudget', fieldName: 'Budget', min: true, constraintKey: 'BUDGET' },
      form: { control: 'number', label: 'Importe presupuestado (€)', section: 'general', order: 6 },
      query: { sortable: 5 },
      table: { show: true, order: 6, label: 'Importe', type: 'number', minWidth: 130 },
      samples: [84200, 21800, 6450, 118900, 7300, 55600, 27400, 5900, 174500, 14200],
      column: { type: 'numeric', precision: 12, scale: 2, default: 0, transformer: 'numeric' }
    },
    status: {
      type: 'string',
      required: true,
      vo: {
        name: 'InstallationStatus',
        fieldName: 'Installation status',
        values: ['quoted', 'approved', 'in_progress', 'finished', 'issue']
      },
      form: {
        control: 'select',
        label: 'Estado',
        id: 'status',
        section: 'planning',
        order: 1,
        placeholder: 'Seleccionar estado',
        options: [
          { value: 'quoted', label: 'Presupuestada' },
          { value: 'approved', label: 'Aprobada' },
          { value: 'in_progress', label: 'En obra' },
          { value: 'finished', label: 'Finalizada' },
          { value: 'issue', label: 'Con incidencia' }
        ]
      },
      query: { filterable: 5, sortable: 6 },
      table: {
        show: true,
        order: 7,
        label: 'Estado',
        filterable: true,
        minWidth: 150,
        type: 'badge',
        badgeMap: {
          quoted: { label: 'Presupuestada', variant: 'outline' },
          approved: { label: 'Aprobada', variant: 'secondary' },
          in_progress: { label: 'En obra', variant: 'default' },
          finished: { label: 'Finalizada', variant: 'ghost' },
          issue: { label: 'Con incidencia', variant: 'destructive' }
        }
      },
      samples: [
        'finished',
        'in_progress',
        'finished',
        'approved',
        'quoted',
        'in_progress',
        'issue',
        'finished',
        'approved',
        'in_progress'
      ],
      column: { type: 'varchar', length: 20, default: 'quoted' }
    },
    startDate: {
      type: 'date',
      required: true,
      // campo de período: lo construye Period, que admite nulos (canon de contract)
      nullable: true,
      voShared: { name: 'ContractDate' },
      vo: { name: 'InstallationStartDate', fieldName: 'Start date' },
      form: { control: 'date', label: 'Inicio previsto', id: 'start', section: 'planning', order: 2 },
      query: { sortable: 7, filterable: 6 },
      table: { show: true, order: 8, label: 'Inicio', type: 'date', minWidth: 120 },
      samples: [
        '2025-09-01',
        '2025-10-06',
        '2025-11-03',
        '2026-01-12',
        '2026-02-02',
        '2026-02-16',
        '2026-03-02',
        '2026-03-16',
        '2026-04-06',
        '2026-04-20'
      ],
      column: { type: 'date', tsType: 'Nullable<string>' }
    },
    endDate: {
      type: 'date',
      required: true,
      // campo de período: lo construye Period, que admite nulos (canon de contract)
      nullable: true,
      voShared: { name: 'ContractDate' },
      vo: { name: 'InstallationEndDate', fieldName: 'End date' },
      form: {
        control: 'date',
        label: 'Fin previsto',
        id: 'end',
        section: 'planning',
        order: 3,
        groupErrorMessage: 'La fecha de fin debe ser posterior a la de inicio'
      },
      query: { sortable: 8 },
      table: { show: true, order: 9, label: 'Fin', type: 'date', minWidth: 120 },
      samples: [
        '2025-09-26',
        '2025-10-31',
        '2025-11-21',
        '2026-02-13',
        '2026-02-20',
        '2026-03-20',
        '2026-03-27',
        '2026-04-10',
        '2026-05-15',
        '2026-05-08'
      ],
      column: { type: 'date', tsType: 'Nullable<string>' }
    }
  },
  list: {
    deleteLabelField: 'code',
    defaultSort: { field: 'startDate', dir: 'desc' },
    features: { create: true, export: ['csv'], search: true, view: true, edit: true, delete: true }
  }
})
