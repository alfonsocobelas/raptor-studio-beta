import { defineResource } from '@raptor/schema'

// Demo model (Solaris Energía): la visita de un técnico a una obra.
// Entra en bloque desde la app de campo, así que estrena el import CSV con un lookup
// denormalizado: el fichero trae el código de obra, no su uuid.
export const worklog = defineResource({
  schemaVersion: 1,
  name: 'worklog',
  plural: 'worklogs',
  context: 'solaris',
  brief:
    'La visita de un técnico a una obra, con sus horas. Entran en bloque desde la app de campo en CSV y su evolución mes a mes es lo que mira el jefe de obra.',
  schemaName: 'solaris',
  route: '/solaris/worklogs',
  sharedDomainAlias: '@solaris/shared/domain',
  labels: {
    singular: 'Parte de trabajo',
    plural: 'Partes de trabajo',
    subtitle: 'Visitas de los técnicos a obra',
    gender: 'm'
  },
  formSections: [{ id: 'general', title: 'Datos del parte' }],
  constraintsConst: 'WORKLOG_CONSTRAINTS',
  audit: true,
  detail: {},
  constraints: {
    INSTALLATION_CODE: { MAX: 20 },
    TECHNICIAN: { MIN: 3, MAX: 150 },
    HOURS: { MIN: 0 },
    RESULT: { MAX: 1000 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    workedOn: {
      type: 'date',
      required: true,
      vo: { name: 'WorklogDate', fieldName: 'Worklog date' },
      form: { control: 'date', label: 'Fecha', section: 'general', order: 1 },
      query: { sortable: 1, filterable: 2 },
      table: { show: true, order: 1, label: 'Fecha', type: 'date', minWidth: 120 },
      samples: [
        '2025-09-03',
        '2025-10-09',
        '2025-11-05',
        '2025-12-11',
        '2026-01-15',
        '2026-02-04',
        '2026-02-19',
        '2026-03-05',
        '2026-03-24',
        '2026-04-08'
      ],
      column: { type: 'date', tsType: 'string' }
    },
    installationId: {
      type: 'uuid',
      required: true,
      query: { filterable: 3 },
      relation: { to: 'installation', kind: 'reference' },
      form: {
        control: 'select',
        label: 'Obra',
        id: 'installation',
        section: 'general',
        order: 2,
        placeholder: 'Seleccionar obra',
        lookup: { resource: 'installation', labelField: 'code', denormalizes: 'installationCode' }
      }
    },
    installationCode: {
      type: 'string',
      required: true,
      vo: {
        name: 'WorklogInstallationCode',
        fieldName: 'Installation code',
        ensure: 'string',
        lengthRule: 'max',
        constraintKey: 'INSTALLATION_CODE'
      },
      query: { filterable: 4, sortable: 2, searchable: 1 },
      table: { show: true, order: 2, label: 'Obra', filterable: true, minWidth: 130 },
      samples: [
        'INS-0001',
        'INS-0002',
        'INS-0003',
        'INS-0004',
        'INS-0005',
        'INS-0006',
        'INS-0007',
        'INS-0008',
        'INS-0009',
        'INS-0010'
      ],
      column: { type: 'varchar', lengthConst: 'INSTALLATION_CODE.MAX' }
    },
    technician: {
      type: 'string',
      required: true,
      vo: {
        name: 'WorklogTechnician',
        fieldName: 'Technician',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'TECHNICIAN'
      },
      form: { control: 'text', label: 'Técnico', section: 'general', order: 3 },
      query: { filterable: 5, sortable: 3, searchable: 2 },
      table: { show: true, order: 3, label: 'Técnico', filterable: true, minWidth: 170 },
      samples: [
        'Óscar Manrique',
        'Iván Delgado',
        'Rubén Casado',
        'Álvaro Tejedor',
        'Noelia Prieto',
        'Iván Delgado',
        'Óscar Manrique',
        'Sergio Bermejo',
        'Noelia Prieto',
        'Rubén Casado'
      ],
      column: { type: 'varchar', lengthConst: 'TECHNICIAN.MAX' }
    },
    workType: {
      type: 'string',
      required: true,
      vo: { name: 'WorklogType', fieldName: 'Worklog type', values: ['assembly', 'maintenance', 'breakdown'] },
      form: {
        control: 'select',
        label: 'Tipo',
        id: 'type',
        section: 'general',
        order: 4,
        placeholder: 'Seleccionar tipo',
        options: [
          { value: 'assembly', label: 'Montaje' },
          { value: 'maintenance', label: 'Mantenimiento' },
          { value: 'breakdown', label: 'Avería' }
        ]
      },
      query: { filterable: 6, sortable: 4 },
      table: {
        show: true,
        order: 4,
        label: 'Tipo',
        filterable: true,
        minWidth: 140,
        type: 'badge',
        badgeMap: {
          assembly: { label: 'Montaje', variant: 'default' },
          maintenance: { label: 'Mantenimiento', variant: 'secondary' },
          breakdown: { label: 'Avería', variant: 'destructive' }
        }
      },
      samples: [
        'assembly',
        'assembly',
        'maintenance',
        'breakdown',
        'assembly',
        'maintenance',
        'assembly',
        'breakdown',
        'assembly',
        'maintenance'
      ],
      column: { type: 'varchar', length: 20, default: 'assembly' }
    },
    hours: {
      type: 'number',
      required: true,
      vo: { name: 'WorklogHours', fieldName: 'Worked hours', min: true, constraintKey: 'HOURS' },
      form: { control: 'number', label: 'Horas', section: 'general', order: 5 },
      query: { sortable: 5 },
      table: { show: true, order: 5, label: 'Horas', type: 'number', minWidth: 90 },
      samples: [8, 6.5, 3, 4.5, 8, 2.5, 7, 5, 8, 3.5],
      column: { type: 'numeric', precision: 6, scale: 2, default: 0, transformer: 'numeric' }
    },
    result: {
      type: 'string',
      vo: { name: 'WorklogResult', fieldName: 'Worklog result', lengthRule: 'max', constraintKey: 'RESULT' },
      form: { control: 'textarea', label: 'Resultado', section: 'general', order: 6, rows: 3, fullWidth: true },
      query: { searchable: 3 },
      table: { show: true, order: 6, label: 'Resultado', sortable: false, minWidth: 280 },
      samples: [
        'Montada la estructura de las 3 filas sur',
        'Cableado de string 1 y 2 terminado',
        'Revisión anual: limpieza y apriete de bornes',
        'Inversor en fallo de aislamiento; sustituido',
        'Colocados 44 paneles y puesta a tierra',
        'Firmware del inversor actualizado',
        'Conexionado a cuadro general y pruebas',
        'String 3 sin producción: conector MC4 dañado',
        'Montaje completo; pendiente de legalizar',
        'Verificada producción tras la avería'
      ],
      column: { type: 'varchar', lengthConst: 'RESULT.MAX', default: '' }
    }
  },
  list: {
    deleteLabelField: 'installationCode',
    defaultSort: { field: 'workedOn', dir: 'desc' },
    features: { create: true, export: ['csv'], search: true, view: true, edit: true, delete: true, import: true }
  }
})
