import { defineApp } from '@raptor/schema'

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
        // convergencia (spec 44): paso con transition — su cuerpo y su endpoint son reales
        { id: 'termina', kind: 'step', text: 'Se termina el contrato', entity: 'contract', transition: 'terminate' },
        { id: 'descartada', kind: 'end', text: 'Petición descartada' },
        { id: 'proyecto', kind: 'step', text: 'Se abre el proyecto de implantación', entity: 'project' },
        { id: 'desvio', kind: 'decision', text: '¿Hay desvío sobre el alcance?' },
        { id: 'ampliacion', kind: 'step', text: 'Se negocia una ampliación de alcance' },
        { id: 'implantado', kind: 'end', text: 'Proyecto implantado' }
      ],
      edges: [
        { from: 'peticion', to: 'contrato' },
        { from: 'contrato', to: 'aprueba' },
        { from: 'aprueba', to: 'termina', label: 'no' },
        { from: 'termina', to: 'descartada' },
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
      // el panel es una secuencia de bloques (spec 53): este orden ES el emitido
      blocks: [
        { kind: 'metrics', resources: ['contract', 'project'] },
        // analíticos (spec 32): compuestos de conteos filtrados sobre el listado
        { kind: 'count-by', resource: 'contract', field: 'contractType', label: 'Contratos por tipo' },
        // el alias histórico: se sigue leyendo y se normaliza a `kpi` (spec 70)
        { kind: 'kpi-count', resource: 'project', field: 'status', equals: 'planning', label: 'Proyectos en planificación' },
        // spec 70: los tres modificadores de la tarjeta, uno por bloque, para que el oro congele
        // el markup de la variación, del porcentaje y de la barra de progreso
        {
          kind: 'kpi',
          resource: 'contract',
          label: 'Altas de cloud este mes',
          condition: { field: 'contractType', operator: 'eq', value: 'cloud' },
          window: { field: 'startDate', preset: 'month' },
          compare: true,
          width: 'half'
        },
        {
          kind: 'kpi',
          resource: 'project',
          label: 'Proyectos cerrados',
          condition: { field: 'status', operator: 'eq', value: 'closed' },
          ratio: true,
          width: 'half'
        },
        { kind: 'kpi', resource: 'contract', label: 'Contratos del año', target: 60, width: 'half' },
        // spec 71: las medidas de verdad, sobre el endpoint de agregación
        {
          kind: 'kpi',
          resource: 'contract',
          label: 'Valor contratado',
          measure: 'sum',
          field: 'totalValue',
          width: 'half'
        },
        {
          kind: 'kpi',
          resource: 'contract',
          label: 'Valor medio de cloud',
          measure: 'avg',
          field: 'totalValue',
          condition: { field: 'contractType', operator: 'eq', value: 'cloud' },
          width: 'half'
        },
        // spec 70: la lista corta ordenada — una petición, no una agregación
        {
          kind: 'top-n',
          resource: 'contract',
          field: 'totalValue',
          n: 5,
          label: 'Mayores contratos',
          width: 'half'
        },
        { kind: 'series', resource: 'contract', field: 'startDate', label: 'Altas de contrato por mes' },
        // spec 52: el listado dentro del panel — la combinación que la demo taller destapó y que
        // el oro no cubría (por eso un DTO obsoleto sobrevivió días)
        { kind: 'table', resource: 'contract' }
      ]
    },
    { kind: 'resource', resource: 'contract' },
    { kind: 'gantt', resource: 'contract' },
    { kind: 'resource', resource: 'project' },
    // spec 48: la página-formulario, con entrada de menú propia
    { kind: 'form', resource: 'project', label: 'Nuevo proyecto' },
    // spec 59: el calendario, cada proyecto como tira en su fecha de inicio
    { kind: 'calendar', resource: 'project', label: 'Calendario de proyectos' },
    // spec 61: el tablero de contratos, columnas por estado y drag por transición
    { kind: 'kanban', resource: 'contract', label: 'Tablero de contratos' }
  ]
})
