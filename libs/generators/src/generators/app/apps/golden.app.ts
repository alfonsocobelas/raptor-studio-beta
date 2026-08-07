import { defineApp } from '@acc/schema'

/**
 * La app del gate de oro postgres (spec 22): la MISMA composición que producían las opciones
 * planas `--models=contract,project --dashboard` (dashboard con un KPI por modelo + una página
 * por recurso, en ese orden), declarada como app-schema para poder llevar un brief. Con él, la
 * fixture congela también el CLAUDE.md emitido — el gate de oro cubre la memoria del negocio.
 */
export const golden = defineApp({
  schemaVersion: 1,
  name: 'golden',
  brief: {
    business:
      'Gestión de licencias SAP para clientes corporativos: contratos con su vigencia y los ' +
      'proyectos de implantación asociados. Es la app de oro del acelerador: su composición ' +
      'ejercita período, lookups, borrado y dashboard.',
    rules: [
      'Un contrato no puede terminar antes de empezar',
      'El número de contrato es único cuando existe (los de maintenance pueden no traerlo)'
    ],
    glossary: [{ term: 'vigencia', means: 'el período entre la fecha de inicio y la de fin del contrato' }]
  },
  pages: [
    {
      kind: 'dashboard',
      label: 'Dashboard',
      widgets: [
        { kind: 'kpi-total', resource: 'contract' },
        { kind: 'kpi-total', resource: 'project' }
      ]
    },
    { kind: 'resource', resource: 'contract' },
    { kind: 'resource', resource: 'project' }
  ]
})
