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
  // los flujos emiten proceso (spec 39): la app de oro congela también la coreografía.
  // Este flujo ejercita a propósito todo lo que deriva el generador: dos entidades (dos
  // repos inyectados), un paso SIN entidad (firma vacía), decisiones con rama etiquetada
  // y un ciclo de vuelta atrás (el JSDoc del paso debe listar sus dos procedencias).
  flows: [
    {
      name: 'Del contrato al proyecto implantado',
      description: 'El recorrido de una venta desde que se firma el contrato hasta que el proyecto queda implantado.',
      nodes: [
        { id: 'peticion', kind: 'start', text: 'El cliente pide una implantación' },
        { id: 'contrato', kind: 'step', text: 'Se firma el contrato con su vigencia', entity: 'contract' },
        { id: 'aprueba', kind: 'decision', text: '¿El comité aprueba el alcance?' },
        { id: 'descartada', kind: 'end', text: 'Petición descartada' },
        { id: 'proyecto', kind: 'step', text: 'Se abre el proyecto de implantación', entity: 'project' },
        { id: 'desvio', kind: 'decision', text: '¿Hay desvío sobre el alcance?' },
        { id: 'ampliacion', kind: 'step', text: 'Se negocia una ampliación de alcance' },
        { id: 'implantado', kind: 'end', text: 'Proyecto implantado' }
      ],
      edges: [
        { from: 'peticion', to: 'contrato' },
        { from: 'contrato', to: 'aprueba' },
        { from: 'aprueba', to: 'descartada', label: 'no' },
        { from: 'aprueba', to: 'proyecto', label: 'sí' },
        { from: 'proyecto', to: 'desvio' },
        { from: 'desvio', to: 'ampliacion', label: 'sí' },
        { from: 'ampliacion', to: 'proyecto' },
        { from: 'desvio', to: 'implantado', label: 'no' }
      ]
    }
  ],
  pages: [
    {
      kind: 'dashboard',
      label: 'Dashboard',
      widgets: [
        { kind: 'kpi-total', resource: 'contract' },
        { kind: 'kpi-total', resource: 'project' },
        // analíticos (spec 32): compuestos de conteos filtrados sobre el listado
        { kind: 'count-by', resource: 'contract', field: 'contractType', label: 'Contratos por tipo' },
        { kind: 'kpi-count', resource: 'project', field: 'status', equals: 'planning', label: 'Proyectos en planificación' },
        { kind: 'series', resource: 'contract', field: 'startDate', label: 'Altas de contrato por mes' }
      ]
    },
    { kind: 'resource', resource: 'contract' },
    { kind: 'gantt', resource: 'contract' },
    { kind: 'resource', resource: 'project' }
  ]
})
