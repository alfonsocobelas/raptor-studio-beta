import { FakeChatAdapter } from '@app/backend/contexts/studio/chat/fake-chat.adapter'
import { validateDesign } from '@app/backend/contexts/studio/chat/validate-proposal'
import type { DesignPayload } from '@app/backend/contexts/studio/chat/chat.types'

const empty = (): DesignPayload => ({ appName: 'mi-app', resources: [], pages: [] })

describe('FakeChatAdapter — modo demo determinista (lienzo en blanco)', () => {
  const adapter = new FakeChatAdapter()

  it('crea una tabla NUEVA con campos tipados inferidos', async () => {
    const { design, reply } = await adapter.propose(
      [{ role: 'user', text: 'Crea una tabla de empleados con nombre, salario y fecha de alta' }],
      empty()
    )

    expect(design.resources).toHaveLength(1)
    const fields = design.resources[0].fields
    expect(fields.map(f => f.type)).toEqual(['string', 'number', 'date'])
    expect(design.pages[0].blocks).toContainEqual({ kind: 'table', resource: 'empleado', width: 'full' })
    expect(reply).toContain('Empleados')
  })

  it('añade un KPI de una entidad existente (creando el dashboard)', async () => {
    const base = await adapter.propose([{ role: 'user', text: 'crea una tabla de vehiculos' }], empty())

    const { design } = await adapter.propose([{ role: 'user', text: 'añade un kpi de vehiculos' }], base.design)

    expect(design.pages[0].blocks[0]).toMatchObject({ kind: 'kpis' })
  })

  it('quita una tabla y limpia sus KPIs', async () => {
    const a = await adapter.propose([{ role: 'user', text: 'crea una tabla de vehiculos' }], empty())
    const b = await adapter.propose([{ role: 'user', text: 'añade un kpi de vehiculos' }], a.design)

    const { design } = await adapter.propose([{ role: 'user', text: 'quita la tabla de vehiculos' }], b.design)

    expect(design.resources).toEqual([])
    expect(design.pages).toEqual([])
  })

  it('si no entiende, devuelve el diseño intacto con ayuda', async () => {
    const original = empty()
    const { design, reply } = await adapter.propose([{ role: 'user', text: 'hazme un sandwich' }], original)

    expect(design).toEqual(original)
    expect(reply).toContain('Modo demo')
  })

  /**
   * El adapter sin clave es el banco de pruebas del estudio: si no entiende lo
   * que se añadió después (relaciones, enums, galería), el estudio solo se puede
   * probar gastando API o con un humano al otro lado del puente.
   */
  describe('gramática de lo nuevo', () => {
    const conPedidos = async (frase: string): Promise<DesignPayload> => {
      const adapter = new FakeChatAdapter()
      const base = await adapter.propose([{ role: 'user', text: 'crea una tabla de clientes con nombre y email' }], {
        appName: 'tienda',
        resources: [],
        pages: []
      })
      const conDos = await adapter.propose(
        [{ role: 'user', text: 'crea una tabla de pedidos con referencia e importe' }],
        base.design
      )
      const result = await adapter.propose([{ role: 'user', text: frase }], conDos.design)
      return result.design
    }

    it('«cada pedido es de un cliente» declara la relación', async () => {
      const design = await conPedidos('cada pedido es de un cliente')
      const pedido = design.resources.find(r => r.name === 'pedido')

      expect(pedido?.fields.some(f => f.type === 'ref' && f.refTo === 'cliente')).toBe(true)
    })

    it('«los pedidos pertenecen a un cliente» también', async () => {
      const design = await conPedidos('los pedidos pertenecen a un cliente')
      const pedido = design.resources.find(r => r.name === 'pedido')

      expect(pedido?.fields.some(f => f.type === 'ref' && f.refTo === 'cliente')).toBe(true)
    })

    it('«añade estado a pedidos con valores abierto, enviado y entregado» crea un enum', async () => {
      const design = await conPedidos('anade estado a pedidos con valores abierto, enviado y entregado')
      const estado = design.resources.find(r => r.name === 'pedido')?.fields.find(f => f.name === 'estado')

      expect(estado?.type).toBe('enum')
      expect(estado?.values?.map(v => v.label)).toEqual(['Abierto', 'Enviado', 'Entregado'])
    })

    it('«muestra los pedidos en galería» añade la vista de tarjetas', async () => {
      const design = await conPedidos('muestra los pedidos en galeria')

      expect(design.pages.some(p => p.blocks.some(b => b.kind === 'cards' && b.resource === 'pedido'))).toBe(true)
    })

    it('«añade la ficha de pedidos» crea su vista de detalle fuera del menú', async () => {
      const design = await conPedidos('anade la ficha de pedidos')
      const ficha = design.pages.find(p => p.blocks.some(b => b.kind === 'fields' && b.resource === 'pedido'))

      expect(ficha?.drillDown).toBe(true)
    })

    it('lo que no entiende lo dice, en vez de inventarse una app', async () => {
      const adapter = new FakeChatAdapter()
      const result = await adapter.propose([{ role: 'user', text: 'haz que vuele' }], {
        appName: 'tienda',
        resources: [],
        pages: []
      })

      expect(result.design.resources).toEqual([])
      expect(result.reply).toMatch(/no|dime|entend/i)
    })
  })
})

/** Spec 22: el modo demo también destila un brief, para que el panel de contexto no parezca roto. */
describe('fake adapter — brief de demostración (spec 22)', () => {
  it('crear la primera entidad deja un brief de app y una frase en la entidad', async () => {
    const adapter = new FakeChatAdapter()

    const proposal = await adapter.propose(
      [{ role: 'user', text: 'crea una tabla de empleados con nombre, puesto y salario' }],
      { appName: 'demo', resources: [], pages: [] }
    )

    expect(proposal.design.brief?.business).toBeTruthy()
    expect(proposal.design.resources[0].brief).toBeTruthy()
  })

  it('un brief ya presente se conserva: destilar no borra lo contado', async () => {
    const adapter = new FakeChatAdapter()
    const brief = { business: 'Negocio contado por el usuario.', rules: ['regla editada a mano'] }

    const proposal = await adapter.propose([{ role: 'user', text: 'crea una tabla de clientes' }], {
      appName: 'demo',
      resources: [],
      pages: [],
      brief
    })

    expect(proposal.design.brief).toEqual(brief)
  })
})

describe('fake adapter — flujo de demostración (spec 28)', () => {
  it('«dibuja el flujo de pedidos» propone un flujo que pasa el gate completo', async () => {
    const adapter = new FakeChatAdapter()
    const pedido = {
      name: 'pedido',
      plural: 'pedidos',
      labelSingular: 'Pedido',
      labelPlural: 'Pedidos',
      gender: 'm' as const,
      fields: [{ name: 'nombre', label: 'Nombre', type: 'string' as const }]
    }

    const proposal = await adapter.propose([{ role: 'user', text: 'dibuja el flujo de pedidos' }], {
      appName: 'demo',
      resources: [pedido],
      pages: []
    })

    expect(proposal.design.flows).toHaveLength(1)
    const flow = proposal.design.flows?.[0]
    expect(flow?.nodes.some(n => n.entity === 'pedido')).toBe(true)
    // el gate REAL: el flujo de demo no puede violar lo que defineApp exige
    expect(() => validateDesign(proposal.design)).not.toThrow()
  })

  it('sin la entidad creada, pide crearla antes en vez de inventarla', async () => {
    const adapter = new FakeChatAdapter()

    const proposal = await adapter.propose([{ role: 'user', text: 'dibuja el flujo de pedidos' }], {
      appName: 'demo',
      resources: [],
      pages: []
    })

    expect(proposal.design.flows ?? []).toHaveLength(0)
    expect(proposal.reply).toMatch(/entidad|crea/i)
  })

  it('los flujos existentes se conservan al pedir cualquier otra cosa', async () => {
    const adapter = new FakeChatAdapter()
    const flows = [
      {
        name: 'Ya dibujado',
        nodes: [
          { id: 'a', kind: 'start' as const, text: 'Inicio' },
          { id: 'b', kind: 'end' as const, text: 'Fin' }
        ],
        edges: [{ from: 'a', to: 'b' }]
      }
    ]

    const proposal = await adapter.propose([{ role: 'user', text: 'crea una tabla de clientes' }], {
      appName: 'demo',
      resources: [],
      pages: [],
      flows
    })

    expect(proposal.design.flows).toEqual(flows)
  })
})
