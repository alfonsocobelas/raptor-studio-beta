import { defineResource } from '@acc/schema'

// Demo model (Solaris Energía): quien contrata la instalación fotovoltaica.
// La baja es reversible — el modelo estrena papelera en una demo con lookup entrante.
export const account = defineResource({
  schemaVersion: 1,
  name: 'account',
  plural: 'accounts',
  context: 'solaris',
  brief: 'Quien contrata la instalación. Se busca por nombre y por CIF; la baja es reversible porque un cliente que se fue puede volver.',
  schemaName: 'solaris',
  route: '/solaris/accounts',
  sharedDomainAlias: '@solaris/shared/domain',
  labels: {
    singular: 'Cliente',
    plural: 'Clientes',
    subtitle: 'Cartera de particulares, empresas y comunidades',
    gender: 'm'
  },
  formSections: [
    { id: 'general', title: 'Identificación' },
    { id: 'contact', title: 'Contacto' }
  ],
  constraintsConst: 'ACCOUNT_CONSTRAINTS',
  audit: true,
  softDelete: true,
  detail: {},
  constraints: {
    NAME: { MIN: 2, MAX: 200 },
    TAX_ID: { MAX: 20 },
    PROVINCE: { MAX: 100 },
    CONTACT: { MAX: 150 },
    PHONE: { MAX: 20 },
    EMAIL: { MAX: 200 }
  },
  fields: {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } },
    name: {
      type: 'string',
      required: true,
      vo: {
        name: 'AccountName',
        fieldName: 'Account name',
        ensure: 'string',
        minLength: true,
        lengthRule: 'max',
        constraintKey: 'NAME'
      },
      form: { control: 'text', label: 'Nombre o razón social', section: 'general', order: 1, fullWidth: true },
      query: { filterable: 2, sortable: 1, searchable: 1 },
      table: { show: true, order: 1, label: 'Nombre', filterable: true, minWidth: 240 },
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
      column: { type: 'varchar', lengthConst: 'NAME.MAX' }
    },
    taxId: {
      type: 'string',
      unique: true,
      vo: {
        name: 'AccountTaxId',
        fieldName: 'Tax ID',
        noInnerWhitespace: true,
        lengthRule: 'max',
        constraintKey: 'TAX_ID'
      },
      form: { control: 'text', label: 'CIF / NIF', section: 'general', order: 2 },
      query: { filterable: 3, sortable: 2, searchable: 2 },
      table: { show: true, order: 2, label: 'CIF / NIF', minWidth: 130 },
      samples: [
        'B47215903',
        'H09318472',
        '12345678Z',
        'A34120988',
        '71263540M',
        'B47902316',
        'H37451209',
        '09876543X',
        'B09447120',
        'B24310587'
      ],
      column: { type: 'varchar', lengthConst: 'TAX_ID.MAX', default: '' }
    },
    accountType: {
      type: 'string',
      required: true,
      vo: { name: 'AccountType', fieldName: 'Account type', values: ['individual', 'company', 'community'] },
      form: {
        control: 'select',
        label: 'Tipo',
        id: 'type',
        section: 'general',
        order: 3,
        placeholder: 'Seleccionar tipo',
        options: [
          { value: 'individual', label: 'Particular' },
          { value: 'company', label: 'Empresa' },
          { value: 'community', label: 'Comunidad de vecinos' }
        ]
      },
      query: { filterable: 4, sortable: 3 },
      table: {
        show: true,
        order: 3,
        label: 'Tipo',
        filterable: true,
        minWidth: 150,
        type: 'badge',
        badgeMap: {
          individual: { label: 'Particular', variant: 'outline' },
          company: { label: 'Empresa', variant: 'default' },
          community: { label: 'Comunidad', variant: 'secondary' }
        }
      },
      samples: [
        'company',
        'community',
        'individual',
        'company',
        'individual',
        'company',
        'community',
        'individual',
        'company',
        'company'
      ],
      column: { type: 'varchar', length: 20, default: 'individual' }
    },
    province: {
      type: 'string',
      vo: { name: 'AccountProvince', fieldName: 'Province', lengthRule: 'max', constraintKey: 'PROVINCE' },
      form: { control: 'text', label: 'Provincia', section: 'general', order: 4 },
      query: { filterable: 5, sortable: 4, searchable: 3 },
      table: { show: true, order: 4, label: 'Provincia', filterable: true, minWidth: 140 },
      samples: [
        'Valladolid',
        'Burgos',
        'Salamanca',
        'Palencia',
        'León',
        'Valladolid',
        'Zamora',
        'Segovia',
        'Burgos',
        'Soria'
      ],
      column: { type: 'varchar', lengthConst: 'PROVINCE.MAX', default: '' }
    },
    contactName: {
      type: 'string',
      vo: { name: 'AccountContact', fieldName: 'Contact name', lengthRule: 'max', constraintKey: 'CONTACT' },
      form: { control: 'text', label: 'Persona de contacto', section: 'contact', order: 1, fullWidth: true },
      query: { searchable: 4 },
      table: { show: true, order: 5, label: 'Contacto', sortable: false, minWidth: 180 },
      samples: [
        'Luis Barrera',
        'Ana Sáez (presidenta)',
        'Marta Ruiz',
        'Diego Salas',
        'Javier Peña',
        'Rocío Lamas',
        'Óscar Gil (administrador)',
        'Elena Cortés',
        'Sergio Antón',
        'Nuria Nieto'
      ],
      column: { type: 'varchar', lengthConst: 'CONTACT.MAX', default: '' }
    },
    phone: {
      type: 'string',
      vo: { name: 'AccountPhone', fieldName: 'Account phone', lengthRule: 'max', constraintKey: 'PHONE' },
      form: { control: 'text', label: 'Teléfono', section: 'contact', order: 2 },
      query: { searchable: 5 },
      table: { show: true, order: 6, label: 'Teléfono', sortable: false, minWidth: 140 },
      samples: [
        '983 214 770',
        '947 336 812',
        '615 302 884',
        '979 118 245',
        '627 941 350',
        '983 550 291',
        '980 447 130',
        '921 662 018',
        '947 209 553',
        '975 384 106'
      ],
      column: { type: 'varchar', lengthConst: 'PHONE.MAX', default: '' }
    },
    email: {
      type: 'string',
      vo: { name: 'AccountEmail', fieldName: 'Account email', lengthRule: 'max', email: true, constraintKey: 'EMAIL' },
      form: { control: 'text', label: 'Email', section: 'contact', order: 3 },
      query: { searchable: 6 },
      table: { show: true, order: 7, label: 'Email', sortable: false, minWidth: 220 },
      samples: [
        'compras@ceramicasduero.es',
        'presidencia@cpplazamayor7.es',
        'marta.ruiz@gmail.com',
        'administracion@agropisuerga.es',
        'jpena@hotmail.com',
        'info@valdehierro.es',
        'admin@cprondasur12.es',
        'elena.cortes@gmail.com',
        'flota@transportesarlanza.es',
        'taller@nietoehijos.es'
      ],
      column: { type: 'varchar', lengthConst: 'EMAIL.MAX', default: '' }
    },
    registeredAt: {
      type: 'date',
      required: true,
      vo: { name: 'AccountRegisteredAt', fieldName: 'Registered at' },
      form: { control: 'date', label: 'Fecha de alta', id: 'registered', section: 'general', order: 5 },
      query: { sortable: 5 },
      table: { show: true, order: 8, label: 'Alta', type: 'date', minWidth: 120 },
      samples: [
        '2024-03-11',
        '2024-06-02',
        '2024-09-18',
        '2025-01-27',
        '2025-02-14',
        '2025-04-30',
        '2025-07-09',
        '2025-10-21',
        '2026-01-15',
        '2026-03-05'
      ],
      column: { type: 'date', tsType: 'string' }
    }
  },
  list: {
    deleteLabelField: 'name',
    defaultSort: { field: 'name', dir: 'asc' },
    features: { create: true, export: ['csv'], search: true, view: true, edit: true, delete: true }
  }
})
