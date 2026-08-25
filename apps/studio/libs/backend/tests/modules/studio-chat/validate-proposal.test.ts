import { validateDesign } from '@app/backend/contexts/studio/chat/validate-proposal'
import type { DesignPayload } from '@app/backend/contexts/studio/chat/chat.types'
import type { BusinessFlow } from '@raptor/schema'

const vehiculo = {
  name: 'vehiculo',
  plural: 'vehiculos',
  labelSingular: 'Vehículo',
  labelPlural: 'Vehículos',
  gender: 'm' as const,
  fields: [{ name: 'matricula', label: 'Matrícula', type: 'string' as const }]
}

describe('validateDesign — gate determinista del diseño', () => {
  it('acepta un diseño válido con entidades nuevas', () => {
    const design: DesignPayload = {
      appName: 'flotas',
      resources: [vehiculo],
      pages: [{ title: 'Vehículos', blocks: [{ kind: 'table', resource: 'vehiculo' }] }]
    }

    expect(() => validateDesign(design)).not.toThrow()
  })

  it('acepta un lienzo vacío (estado válido de diseño)', () => {
    expect(() => validateDesign({ appName: 'x', resources: [], pages: [] })).not.toThrow()
  })

  it('rechaza páginas que referencian entidades no declaradas', () => {
    const design: DesignPayload = {
      appName: 'flotas',
      resources: [vehiculo],
      pages: [{ title: 'Rota', blocks: [{ kind: 'table', resource: 'fantasma' }] }]
    }

    expect(() => validateDesign(design)).toThrow(/entidad inexistente: fantasma/)
  })

  it('rechaza entidades cuyo draft no expande a un resource-schema válido', () => {
    const design: DesignPayload = {
      appName: 'flotas',
      resources: [{ ...vehiculo, name: 'Mal Nombre' }],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow()
  })

  it('acepta una referencia a una entidad declarada', () => {
    const design: DesignPayload = {
      appName: 'vetcare',
      resources: [
        vehiculo,
        {
          ...vehiculo,
          name: 'cita',
          plural: 'citas',
          labelSingular: 'Cita',
          labelPlural: 'Citas',
          fields: [
            { name: 'motivo', label: 'Motivo', type: 'string' as const },
            { name: 'vehiculo', label: 'Vehículo', type: 'ref' as const, refTo: 'vehiculo' }
          ]
        }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).not.toThrow()
  })

  it('rechaza una referencia a una entidad que no existe: sería una FK rota', () => {
    const design: DesignPayload = {
      appName: 'vetcare',
      resources: [
        {
          ...vehiculo,
          fields: [{ name: 'duenio', label: 'Dueño', type: 'ref' as const, refTo: 'fantasma' }]
        }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/vehiculo.*fantasma/i)
  })

  it('rechaza una referencia a sí misma: el canon no la emite', () => {
    const design: DesignPayload = {
      appName: 'vetcare',
      resources: [
        {
          ...vehiculo,
          fields: [{ name: 'padre', label: 'Padre', type: 'ref' as const, refTo: 'vehiculo' }]
        }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/sí misma|itself/i)
  })

  it('rechaza un enum sin valores: un conjunto cerrado vacío no cierra nada', () => {
    const design: DesignPayload = {
      appName: 'inmo',
      resources: [{ ...vehiculo, fields: [{ name: 'estado', label: 'Estado', type: 'enum' as const, values: [] }] }],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/estado.*valores|values/i)
  })

  it('rechaza un enum con valores repetidos', () => {
    const design: DesignPayload = {
      appName: 'inmo',
      resources: [
        {
          ...vehiculo,
          fields: [
            {
              name: 'estado',
              label: 'Estado',
              type: 'enum' as const,
              values: [
                { value: 'alta', label: 'Alta' },
                { value: 'alta', label: 'Alta duplicada' }
              ]
            }
          ]
        }
      ],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/repetid|duplicad/i)
  })
})

/**
 * Spec 22: el brief viaja con el diseño y el gate lo somete a los mismos topes que el schema —
 * la IA no puede degradar el prompt metiendo texto sin límite.
 */
describe('validateDesign — el brief pasa por el gate (spec 22)', () => {
  const base = (): DesignPayload => ({
    appName: 'vetcare',
    resources: [vehiculo],
    pages: []
  })

  it('acepta y conserva un brief válido de app y de entidad', () => {
    const design = {
      ...base(),
      brief: { business: 'Taller de vehículos: recepción, reparación y entrega.', rules: ['No se entrega sin pagar'] },
      resources: [{ ...vehiculo, brief: 'Un vehículo en el taller; su matrícula lo identifica.' }]
    }

    const clean = validateDesign(design)

    expect(clean.brief?.business).toContain('Taller')
    expect(clean.resources[0].brief).toContain('matrícula')
  })

  it('rechaza un brief de app que excede los topes', () => {
    const design = { ...base(), brief: { business: 'x'.repeat(1201) } }

    expect(() => validateDesign(design)).toThrow(/brief\.business/)
  })

  it('rechaza un brief de app con business vacío', () => {
    const design = { ...base(), brief: { business: '  ' } }

    expect(() => validateDesign(design)).toThrow(/brief\.business/)
  })

  it('rechaza un brief de entidad que excede su tope (500)', () => {
    const design = { ...base(), resources: [{ ...vehiculo, brief: 'x'.repeat(501) }] }

    expect(() => validateDesign(design)).toThrow(/brief/)
  })
})

describe('validateDesign — los flujos pasan por el gate (spec 28)', () => {
  const base = (): DesignPayload => ({
    appName: 'flotas',
    resources: [vehiculo],
    pages: []
  })

  const validFlow = (): BusinessFlow => ({
    name: 'Alta de vehículo',
    nodes: [
      { id: 'llega', kind: 'start' as const, text: 'Llega el vehículo', entity: 'vehiculo' },
      { id: 'registrar', kind: 'step' as const, text: 'Se registra' },
      { id: 'fin', kind: 'end' as const, text: 'En servicio' }
    ],
    edges: [
      { from: 'llega', to: 'registrar' },
      { from: 'registrar', to: 'fin' }
    ]
  })

  it('acepta un flujo válido y lo conserva', () => {
    const design = { ...base(), flows: [validFlow()] }

    const clean = validateDesign(design)

    expect(clean.flows).toHaveLength(1)
    expect(clean.flows?.[0].name).toBe('Alta de vehículo')
  })

  it('rechaza un flujo estructuralmente inválido (sin nodo de fin)', () => {
    const flow = validFlow()
    flow.nodes = flow.nodes.filter(n => n.kind !== 'end')
    flow.edges = flow.edges.filter(e => e.to !== 'fin')

    expect(() => validateDesign({ ...base(), flows: [flow] })).toThrow(/end/)
  })

  it('rechaza un nodo que alude a una entidad no declarada en el diseño', () => {
    const flow = validFlow()
    flow.nodes[1] = { ...flow.nodes[1], entity: 'fantasma' }

    expect(() => validateDesign({ ...base(), flows: [flow] })).toThrow(/fantasma/)
  })
})

/**
 * Spec 43: la máquina de estados cruza la frontera. El draft la declara, draftToResource
 * la pasa al schema (donde dispara el gate de defineResource), y los pasos de flujo que
 * referencian una transición deben apuntar a una que exista en la máquina de su entidad.
 */
describe('validateDesign — la máquina de estados (spec 43)', () => {
  const solicitud = () => ({
    name: 'solicitud',
    plural: 'solicitudes',
    labelSingular: 'Solicitud',
    labelPlural: 'Solicitudes',
    gender: 'f' as const,
    fields: [
      { name: 'titulo', label: 'Título', type: 'string' as const },
      {
        name: 'estado',
        label: 'Estado',
        type: 'enum' as const,
        values: [
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'aprobada', label: 'Aprobada' },
          { value: 'descartada', label: 'Descartada' }
        ]
      }
    ],
    state: {
      field: 'estado',
      initial: 'pendiente',
      transitions: [
        { name: 'aprobar', label: 'Aprobar', from: ['pendiente'], to: 'aprobada' },
        { name: 'descartar', label: 'Descartar', from: ['pendiente'], to: 'descartada' }
      ]
    }
  })

  const base = (resource = solicitud(), flows?: BusinessFlow[]): DesignPayload => ({
    appName: 'tramites',
    resources: [resource],
    pages: [{ title: 'Solicitudes', blocks: [{ kind: 'table', resource: 'solicitud' }] }],
    ...(flows ? { flows } : {})
  })

  it('acepta un diseño cuya entidad declara una máquina válida', () => {
    expect(() => validateDesign(base())).not.toThrow()
  })

  it('una máquina sin transiciones se rechaza: congela el campo sin que nadie pueda moverlo', () => {
    const broken = solicitud()
    broken.state = { ...broken.state, transitions: [] }

    expect(() => validateDesign(base(broken))).toThrow(/sin transiciones/)
  })

  it('una máquina que no pasa el gate del schema se rechaza con su motivo', () => {
    const broken = solicitud()
    broken.state = { ...broken.state, initial: 'limbo' }

    expect(() => validateDesign(base(broken))).toThrow(/limbo/)
  })

  it('un paso de flujo puede referenciar una transición que existe en la máquina', () => {
    const flow: BusinessFlow = {
      name: 'Tramitación',
      nodes: [
        { id: 'entra', kind: 'start', text: 'Entra la solicitud' },
        { id: 'aprueba', kind: 'step', text: 'Se aprueba', entity: 'solicitud', transition: 'aprobar' },
        { id: 'fin', kind: 'end', text: 'Tramitada' }
      ],
      edges: [
        { from: 'entra', to: 'aprueba' },
        { from: 'aprueba', to: 'fin' }
      ]
    }

    expect(() => validateDesign(base(solicitud(), [flow]))).not.toThrow()
  })

  it('una transición que no existe en la máquina de su entidad se rechaza', () => {
    const flow: BusinessFlow = {
      name: 'Tramitación',
      nodes: [
        { id: 'entra', kind: 'start', text: 'Entra la solicitud' },
        { id: 'aprueba', kind: 'step', text: 'Se aprueba', entity: 'solicitud', transition: 'fantasma' },
        { id: 'fin', kind: 'end', text: 'Tramitada' }
      ],
      edges: [
        { from: 'entra', to: 'aprueba' },
        { from: 'aprueba', to: 'fin' }
      ]
    }

    expect(() => validateDesign(base(solicitud(), [flow]))).toThrow(
      /«Tramitación».*transición inexistente.*fantasma.*solicitud/
    )
  })

  it('una transición sobre una entidad sin máquina se rechaza: no hay dónde mirarla', () => {
    const noMachine = { ...solicitud() } as Record<string, unknown>
    delete noMachine['state']
    const flow: BusinessFlow = {
      name: 'Tramitación',
      nodes: [
        { id: 'entra', kind: 'start', text: 'Entra la solicitud' },
        { id: 'aprueba', kind: 'step', text: 'Se aprueba', entity: 'solicitud', transition: 'aprobar' },
        { id: 'fin', kind: 'end', text: 'Tramitada' }
      ],
      edges: [
        { from: 'entra', to: 'aprueba' },
        { from: 'aprueba', to: 'fin' }
      ]
    }

    expect(() => validateDesign(base(noMachine as never, [flow]))).toThrow(/no declara máquina de estados/)
  })
})

/**
 * Spec 46: la matriz de accesos pasa el gate en la frontera con mensaje accionable,
 * como las transiciones de la 43 — el error llega al diseñar, no al generar.
 */
describe('validateDesign — matriz de accesos (spec 46)', () => {
  const factura = {
    name: 'factura',
    plural: 'facturas',
    labelSingular: 'Factura',
    labelPlural: 'Facturas',
    gender: 'f' as const,
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'string' as const },
      {
        name: 'estado',
        label: 'Estado',
        type: 'enum' as const,
        values: [
          { value: 'borrador', label: 'Borrador' },
          { value: 'aprobada', label: 'Aprobada' }
        ]
      }
    ],
    state: {
      field: 'estado',
      initial: 'borrador',
      transitions: [{ name: 'aprobar', label: 'Aprobar', from: ['borrador'], to: 'aprobada' }]
    }
  }

  it('acepta una matriz válida (incluidos arrays vacíos: solo admin)', () => {
    const design: DesignPayload = {
      appName: 'ventas',
      resources: [{ ...factura, access: { view: ['user'], manage: [], transitions: { aprobar: [] } } }],
      pages: []
    }

    expect(() => validateDesign(design)).not.toThrow()
  })

  it('rechaza transitions sobre una entidad sin máquina, con mensaje accionable', () => {
    const { state: _out, ...sinMaquina } = factura
    const design: DesignPayload = {
      appName: 'ventas',
      resources: [{ ...sinMaquina, fields: [factura.fields[0]], access: { transitions: { aprobar: ['user'] } } }],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/factura no declara máquina de estados/)
  })

  it('rechaza un verbo que no existe en la máquina de la entidad', () => {
    const design: DesignPayload = {
      appName: 'ventas',
      resources: [{ ...factura, access: { transitions: { fantasma: ['user'] } } }],
      pages: []
    }

    expect(() => validateDesign(design)).toThrow(/«fantasma» no está en la máquina de factura/)
  })
})
