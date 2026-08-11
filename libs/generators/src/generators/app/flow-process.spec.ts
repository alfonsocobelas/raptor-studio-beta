import type { BusinessFlow } from '@acc/schema'
import { flowClassDoc, flowProcessNames, flowRepoDeps, flowStepMethods } from './flow-process'

/**
 * Spec 39, TASK-02: derivación de nombres del proceso emitido. Toda la lógica vive
 * aquí (regla 8): la plantilla solo interpolará estos valores. El flujo NO se ejecuta
 * (regla 7): solo los nodos `step` derivan método; start/end/decision son documentación.
 */
describe('flow-process — derivación de nombres (spec 39)', () => {
  const flow: BusinessFlow = {
    name: 'De presupuesto a legalización',
    nodes: [
      { id: 'llega-obra', kind: 'start', text: 'Llega una obra' },
      { id: 'presupuesto', kind: 'step', text: 'Se solicita presupuesto', entity: 'instalacion' },
      { id: 'aprueba', kind: 'decision', text: '¿Aprueba el cliente?' },
      { id: 'planifica-montaje', kind: 'step', text: 'Se planifica el montaje', entity: 'instalacion' },
      { id: 'fin', kind: 'end', text: 'Instalación legalizada' }
    ],
    edges: [
      { from: 'llega-obra', to: 'presupuesto' },
      { from: 'presupuesto', to: 'aprueba' },
      { from: 'aprueba', to: 'planifica-montaje', label: 'sí' },
      { from: 'planifica-montaje', to: 'fin' }
    ]
  }

  it('deriva carpeta/fichero en kebab sin acentos y clase PascalCase con sufijo Process', () => {
    // WHEN
    const derived = flowProcessNames(flow)

    // THEN
    expect(derived.fileName).toBe('de-presupuesto-a-legalizacion')
    expect(derived.className).toBe('DePresupuestoALegalizacionProcess')
  })

  it('solo los nodos step derivan método, en orden BFS y con nombre camelCase', () => {
    // WHEN
    const methods = flowStepMethods(flow)

    // THEN: ni start, ni decision, ni end — y 'planifica-montaje' → 'planificaMontaje'
    expect(methods.map(m => m.methodName)).toEqual(['presupuesto', 'planificaMontaje'])
    expect(methods.map(m => m.node.id)).toEqual(['presupuesto', 'planifica-montaje'])
  })

  it('la firma lleva id tipado solo si el nodo declara entity', () => {
    // GIVEN: un flujo con un step sin entidad
    const conCierre: BusinessFlow = {
      ...flow,
      nodes: [...flow.nodes, { id: 'cierre-mensual', kind: 'step', text: 'Cierre administrativo' }],
      edges: [...flow.edges, { from: 'fin', to: 'cierre-mensual' }]
    }

    // WHEN
    const methods = flowStepMethods(conCierre)

    // THEN: firmas estables (el harvest no cubre firmas): id tipado con el VO del canon o nada
    expect(methods.find(m => m.methodName === 'presupuesto')?.params).toBe('id: InstalacionId')
    expect(methods.find(m => m.methodName === 'cierreMensual')?.params).toBe('')
  })

  it('el constructor inyecta los repos citados, deduplicados y en orden de primera aparición BFS', () => {
    // GIVEN: dos steps citan instalacion y un tercero (posterior en BFS) cita parte
    const conParte: BusinessFlow = {
      ...flow,
      nodes: [...flow.nodes, { id: 'monta-parte', kind: 'step', text: 'Se abre parte', entity: 'parte' }],
      edges: [...flow.edges, { from: 'planifica-montaje', to: 'monta-parte' }]
    }

    // WHEN
    const deps = flowRepoDeps(conParte)

    // THEN: instalacion aparece una sola vez y antes que parte
    expect(deps).toEqual([
      { entity: 'instalacion', className: 'InstalacionRepository', propertyName: 'instalacionRepository' },
      { entity: 'parte', className: 'ParteRepository', propertyName: 'parteRepository' }
    ])
  })

  it('los repos también cuentan las entidades citadas por nodos que no son step', () => {
    // GIVEN: solo el start cita entidad
    const soloStart: BusinessFlow = {
      name: 'Alta',
      nodes: [
        { id: 'llega', kind: 'start', text: 'Llega un pedido', entity: 'pedido' },
        { id: 'fin', kind: 'end', text: 'Registrado' }
      ],
      edges: [{ from: 'llega', to: 'fin' }]
    }

    // WHEN / THEN
    expect(flowRepoDeps(soloStart).map(d => d.className)).toEqual(['PedidoRepository'])
  })

  it('la cabecera de la clase lleva nombre, descripción y el MISMO mapa numerado del CLAUDE.md', () => {
    // GIVEN
    const conDescripcion: BusinessFlow = { ...flow, description: 'De la solicitud a la obra legalizada.' }

    // WHEN
    const doc = flowClassDoc(conDescripcion)

    // THEN: reutiliza renderFlowSteps — una sola fuente para el mapa
    expect(doc[0]).toBe('De presupuesto a legalización')
    expect(doc).toContain('De la solicitud a la obra legalizada.')
    expect(doc).toContain('1. (inicio) Llega una obra')
    expect(doc).toContain('   - sí → 4')
  })

  it('sin descripción la cabecera va del nombre al mapa, sin línea vacía duplicada', () => {
    const doc = flowClassDoc(flow)

    expect(doc[0]).toBe('De presupuesto a legalización')
    expect(doc[1]).toBe('')
    expect(doc[2]).toBe('1. (inicio) Llega una obra')
  })

  it('el JSDoc de cada método lleva número de paso, texto, procedencia y destino', () => {
    // WHEN
    const presupuesto = flowStepMethods(flow).find(m => m.methodName === 'presupuesto')

    // THEN
    expect(presupuesto?.docLines).toEqual([
      'Paso 2 — Se solicita presupuesto',
      'Viene de: 1. Llega una obra',
      'Va a: 3. ¿Aprueba el cliente?'
    ])
  })

  it('venir de una decisión anota la etiqueta de la rama', () => {
    // WHEN
    const planifica = flowStepMethods(flow).find(m => m.methodName === 'planificaMontaje')

    // THEN
    expect(planifica?.docLines).toContain('Viene de: 3. ¿Aprueba el cliente? (rama «sí»)')
    expect(planifica?.docLines).toContain('Va a: 5. Instalación legalizada')
  })

  it('un flujo sin nodos step no deriva ningún método', () => {
    // GIVEN
    const empty: BusinessFlow = {
      name: 'Solo documental',
      nodes: [
        { id: 'a', kind: 'start', text: 'Inicio' },
        { id: 'b', kind: 'end', text: 'Fin' }
      ],
      edges: [{ from: 'a', to: 'b' }]
    }

    // WHEN / THEN
    expect(flowStepMethods(empty)).toEqual([])
  })
})
