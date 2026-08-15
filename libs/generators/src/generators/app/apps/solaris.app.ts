import { defineApp } from '@raptor/schema'

/**
 * Solaris Energía — instaladora de fotovoltaica (demo 2026-08-10, diseñada en el chat
 * del estudio vía puente). Es la demo más ancha del registro: reúne los cuatro widgets
 * analíticos, el cronograma, la galería y las fichas en una sola app, para que un fallo
 * en cualquier pieza del generador se vea al abrir el navegador.
 */
export const solaris = defineApp({
  schemaVersion: 1,
  name: 'solaris',
  theme: { id: 'ocean' },
  ports: { api: 3500, web: 4500, postgres: 5500, postgresTest: 5501 },
  brief: {
    business:
      'Solaris Energía es una instaladora de fotovoltaica en Castilla y León: unos 30 empleados y 12 técnicos en calle. Vende e instala autoconsumo a particulares, empresas y comunidades de vecinos. El trabajo se organiza por obras: cada venta se convierte en una instalación con su presupuesto, sus fechas previstas, su material y las visitas de los técnicos. Hoy todo vive en Excel y el problema que más duele es que se pierden los boletines de instalación, obligatorios para legalizar la obra.',
    rules: [
      'El código de la obra (INS-0001) lo asigna siempre el sistema: ni el comercial lo propone ni el formulario lo edita.',
      'Un cliente dado de baja no se borra de verdad: puede volver, así que la baja es reversible.',
      'Cada obra debe poder acumular sus documentos: plano, memoria técnica, boletín y certificado de fin de obra.',
      'De cada obra hay que poder reconstruir quién tocó qué y cuándo, porque las reclamaciones llegan meses después.',
      'Las tarifas de proveedor y los partes de trabajo entran en bloque desde CSV, no uno a uno.'
    ],
    glossary: [
      { term: 'obra', means: 'Una instalación fotovoltaica de principio a fin' },
      { term: 'CIE', means: 'El boletín de instalación que legaliza la obra' },
      { term: 'parte', means: 'La visita de un técnico a una obra, con sus horas' },
      { term: 'kWp', means: 'Potencia pico instalada, la medida comercial de la obra' }
    ]
  },
  flows: [
    {
      // `status` anota en qué estado deja la obra cada paso, y la frontera comprueba que
      // ese valor existe en el enum del modelo (spec 39, punto 1). Los pasos de `worklog`
      // no lo declaran: su único enum es un TIPO de parte, no un estado.
      name: 'De presupuesto a legalización',
      description: 'El recorrido de una obra desde que el comercial la presupuesta hasta que se legaliza con el CIE.',
      nodes: [
        { id: 'peticion', kind: 'start', text: 'El cliente pide presupuesto' },
        { id: 'presupuesto', kind: 'step', text: 'Se da de alta la obra presupuestada', entity: 'installation', status: 'quoted' },
        { id: 'acepta', kind: 'decision', text: '¿El cliente la aprueba?' },
        { id: 'descartada', kind: 'end', text: 'Obra descartada' },
        { id: 'planifica', kind: 'step', text: 'Se fijan fechas de inicio y fin', entity: 'installation', status: 'approved' },
        { id: 'montaje', kind: 'step', text: 'Los técnicos parten las visitas de montaje', entity: 'worklog' },
        { id: 'incidencia', kind: 'decision', text: '¿Hay incidencia en obra?' },
        { id: 'averia', kind: 'step', text: 'Parte de avería y vuelta a montaje', entity: 'worklog' },
        { id: 'cie', kind: 'step', text: 'Se sube el CIE y el certificado', entity: 'installation', status: 'finished' },
        { id: 'legalizada', kind: 'end', text: 'Obra finalizada y legalizada' }
      ],
      edges: [
        { from: 'peticion', to: 'presupuesto' },
        { from: 'presupuesto', to: 'acepta' },
        { from: 'acepta', to: 'descartada', label: 'no' },
        { from: 'acepta', to: 'planifica', label: 'sí' },
        { from: 'planifica', to: 'montaje' },
        { from: 'montaje', to: 'incidencia' },
        { from: 'incidencia', to: 'averia', label: 'sí' },
        { from: 'averia', to: 'montaje' },
        { from: 'incidencia', to: 'cie', label: 'no' },
        { from: 'cie', to: 'legalizada' }
      ]
    }
  ],
  pages: [
    {
      kind: 'dashboard',
      label: 'Panel',
      widgets: [
        { kind: 'kpi-total', resource: 'installation' },
        { kind: 'kpi-count', resource: 'installation', field: 'status', equals: 'in_progress', label: 'En obra ahora' },
        { kind: 'kpi-total', resource: 'account' },
        { kind: 'count-by', resource: 'installation', field: 'status', label: 'Obras por estado' },
        { kind: 'series', resource: 'worklog', field: 'workedOn', label: 'Partes por mes' }
      ]
    },
    { kind: 'resource', resource: 'installation' },
    { kind: 'gantt', resource: 'installation' },
    { kind: 'resource', resource: 'account' },
    { kind: 'cards', resource: 'material' },
    { kind: 'resource', resource: 'worklog' }
  ]
})
