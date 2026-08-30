import { defineApp } from '@raptor/schema'

/**
 * La app del gate de oro MONGO (spec 76): el espejo del feature-set de `golden` sobre los
 * modelos que el motor mongo puede honrar. Sin project: lleva adjuntos, que emiten una
 * entidad TypeORM y el generador los rechaza con mongo antes de emitir (spec 25). El trío
 * ejercita lo que el gate plano (`--models … --dashboard`) no vigilaba: kpi-row mixta (73),
 * medidas del endpoint aggregate (71), agregación agrupada (72), kanban por transición (61),
 * flujo con paso de transición (44), composición embebida (customer) y softDelete (license).
 */
export const goldenMongo = defineApp({
  schemaVersion: 1,
  name: 'golden-mongo',
  brief: {
    business:
      'Gestión de licencias SAP sobre MongoDB: clientes con sus contactos, contratos con su ' +
      'vigencia y las licencias que consumen. Es la app de oro del motor mongo: congela los ' +
      'documentos embebidos, las agregaciones y el tablero por transición.',
    rules: [
      'Un contrato no puede terminar antes de empezar',
      'Una licencia borrada no vuelve a listarse (borrado suave)'
    ],
    glossary: [{ term: 'vigencia', means: 'el período entre la fecha de inicio y la de fin del contrato' }]
  },
  // el flujo pequeño del motor mongo: un paso con transición real (terminate) y un paso
  // sobre otra entidad — el proceso emitido inyecta dos repositorios Mongoose
  flows: [
    {
      name: 'Del alta del cliente al contrato terminado',
      description: 'El recorrido desde que se da de alta el cliente hasta que su contrato se termina.',
      nodes: [
        { id: 'peticion', kind: 'start', text: 'Llega un cliente nuevo' },
        { id: 'alta', kind: 'step', text: 'Se da de alta el cliente con sus contactos', entity: 'customer' },
        { id: 'contrato', kind: 'step', text: 'Se firma el contrato con su vigencia', entity: 'contract' },
        { id: 'renueva', kind: 'decision', text: '¿El cliente renueva?' },
        { id: 'termina', kind: 'step', text: 'Se termina el contrato', entity: 'contract', transition: 'terminate' },
        { id: 'cerrado', kind: 'end', text: 'Contrato terminado' },
        { id: 'vigente', kind: 'end', text: 'Contrato en vigor' }
      ],
      edges: [
        { from: 'peticion', to: 'alta' },
        { from: 'alta', to: 'contrato' },
        { from: 'contrato', to: 'renueva' },
        { from: 'renueva', to: 'termina', label: 'no' },
        { from: 'termina', to: 'cerrado' },
        { from: 'renueva', to: 'vigente', label: 'sí' }
      ]
    }
  ],
  pages: [
    {
      kind: 'dashboard',
      label: 'Dashboard',
      blocks: [
        // spec 73: la fila mixta — dos contadores y una lista corta en la misma línea
        {
          kind: 'kpi-row',
          cells: [
            { kind: 'counter', resource: 'contract' },
            { kind: 'counter', resource: 'customer' },
            { kind: 'top-n', resource: 'contract', field: 'totalValue', n: 3, dir: 'asc', label: 'Menores contratos' }
          ]
        },
        { kind: 'count-by', resource: 'contract', field: 'contractType', label: 'Contratos por tipo' },
        // spec 72: la agregación agrupada con medida — en mongo sale de $group, no de GROUP BY
        {
          kind: 'count-by',
          resource: 'contract',
          field: 'contractType',
          measure: 'sum',
          measureField: 'totalValue',
          label: 'Valor por tipo de contrato',
          width: 'half'
        },
        // spec 70: los modificadores de la tarjeta — variación, porcentaje y objetivo
        {
          kind: 'kpi',
          resource: 'contract',
          label: 'Altas de cloud este mes',
          condition: { field: 'contractType', operator: 'eq', value: 'cloud' },
          window: { field: 'startDate', preset: 'month' },
          compare: true,
          sparkline: true,
          width: 'half'
        },
        {
          kind: 'kpi',
          resource: 'license',
          label: 'Licencias activas',
          condition: { field: 'status', operator: 'eq', value: 'active' },
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
        { kind: 'top-n', resource: 'contract', field: 'totalValue', n: 5, label: 'Mayores contratos', width: 'half' },
        { kind: 'series', resource: 'contract', field: 'startDate', label: 'Altas de contrato por mes' },
        // spec 72: la serie mensual con medida — el bucket %Y-%m del $dateToString
        {
          kind: 'series',
          resource: 'contract',
          field: 'startDate',
          measure: 'sum',
          measureField: 'totalValue',
          label: 'Valor contratado por mes',
          width: 'half'
        },
        { kind: 'table', resource: 'contract' }
      ]
    },
    { kind: 'resource', resource: 'contract' },
    { kind: 'gantt', resource: 'contract' },
    { kind: 'resource', resource: 'customer' },
    { kind: 'resource', resource: 'license' },
    // spec 48: la página-formulario con entrada de menú propia
    { kind: 'form', resource: 'customer', label: 'Nuevo cliente' },
    // spec 61: el tablero por estado — el drag dispara la transición contra Mongoose
    { kind: 'kanban', resource: 'contract', label: 'Tablero de contratos' }
  ]
})
