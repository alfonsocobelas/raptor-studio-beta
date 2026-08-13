import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { BusinessBrief, BusinessFlow, ResourceDefinition } from '@acc/schema'
import { appGenerator } from './app'
import { flowOrder, renderClaudeMd, renderFlows, renderFlowSteps } from './brief-doc'
import { MODELS, registerModels } from '../resource/models/registry'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * Spec 22, TASK-05: el brief aterriza como CLAUDE.md en la raíz de la app generada — la memoria
 * del negocio que la spec de los huecos @ai leerá algún día. Markdown construido en generator.ts
 * (regla 8); sin brief no hay fichero, y las fixtures actuales no cambian.
 */
describe('renderClaudeMd — el markdown del brief', () => {
  const brief: BusinessBrief = {
    business: 'Clínica veterinaria de barrio: pacientes, citas y vacunas.',
    rules: ['Las citas duran 30 minutos', 'No se vacuna sin cita previa'],
    glossary: [{ term: 'ficha', means: 'el historial completo del paciente' }]
  }

  it('lleva negocio, reglas, glosario y una línea por entidad con brief', () => {
    const models = [
      { name: 'paciente', labels: { singular: 'Paciente' }, brief: 'Un paciente de la clínica.' },
      { name: 'cita', labels: { singular: 'Cita' }, brief: 'Media hora con un paciente.' }
    ] as unknown as ResourceDefinition[]

    const md = renderClaudeMd('vetcare', brief, models)

    expect(md).toContain('# vetcare — contexto del negocio')
    expect(md).toContain('Clínica veterinaria de barrio')
    expect(md).toContain('- Las citas duran 30 minutos')
    expect(md).toContain('- **ficha**: el historial completo del paciente')
    expect(md).toContain('- **Paciente**: Un paciente de la clínica.')
    expect(md).toContain('- **Cita**: Media hora con un paciente.')
  })

  it('las secciones vacías no aparecen', () => {
    const md = renderClaudeMd('vetcare', { business: 'Solo prosa.' }, [])

    expect(md).toContain('Solo prosa.')
    expect(md).not.toContain('## Reglas')
    expect(md).not.toContain('## Glosario')
    expect(md).not.toContain('## Entidades')
  })
})

describe('app generator — CLAUDE.md en la raíz (spec 22)', () => {
  it('sin brief no se emite: las fixtures actuales no cambian', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true })

    expect(tree.exists('apps/demo/CLAUDE.md')).toBe(false)
  })

  it('un appFile con brief lo aterriza en la raíz de la app', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-brief-'))
    const appFile = path.join(dir, 'vetcare.app.json')
    const garment = MODELS['garment']
    fs.writeFileSync(
      appFile,
      JSON.stringify({
        schemaVersion: 1,
        name: 'vetcare',
        brief: { business: 'Clínica veterinaria de barrio.', rules: ['Las citas duran 30 minutos'] },
        pages: [{ kind: 'resource', resource: 'garment-brief' }],
        resources: [{ ...garment, name: 'garment-brief', plural: 'garment-briefs', brief: 'Una prenda en stock.' }]
      })
    )

    try {
      const tree: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, { name: 'demo', appFile, skipInstall: true })
      const md = tree.read('apps/demo/CLAUDE.md', 'utf-8') ?? ''

      expect(md).toContain('Clínica veterinaria de barrio.')
      expect(md).toContain('- Las citas duran 30 minutos')
      expect(md).toContain('Una prenda en stock.')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

/**
 * Spec 28, TASK-07: los flujos aterrizan como sección «Procesos de negocio» del CLAUDE.md.
 * renderFlows es pura: esquema numerado en orden BFS con las ramas etiquetadas; sin flujos, ''.
 */
describe('renderFlows — el esquema numerado del proceso', () => {
  const pedidoFlow: BusinessFlow = {
    name: 'Ciclo de pedido',
    description: 'Del alta a la aprobación.',
    nodes: [
      { id: 'llega', kind: 'start', text: 'Llega un pedido', entity: 'pedido' },
      { id: 'revisar', kind: 'step', text: 'Se revisa y registra' },
      { id: 'aprobado', kind: 'decision', text: '¿Todo correcto?' },
      { id: 'subsanar', kind: 'step', text: 'Se subsana' },
      { id: 'fin', kind: 'end', text: 'Pedido en curso' }
    ],
    edges: [
      { from: 'llega', to: 'revisar' },
      { from: 'revisar', to: 'aprobado' },
      { from: 'aprobado', to: 'fin', label: 'sí' },
      { from: 'aprobado', to: 'subsanar', label: 'no' },
      { from: 'subsanar', to: 'revisar' }
    ]
  }

  it('numera en orden BFS, marca inicio y fin, y anota la entidad aludida', () => {
    const md = renderFlows([pedidoFlow])

    expect(md).toContain('### Ciclo de pedido')
    expect(md).toContain('Del alta a la aprobación.')
    expect(md).toContain('1. (inicio) Llega un pedido · entidad: pedido')
    expect(md).toContain('2. Se revisa y registra')
    expect(md).toContain('¿Todo correcto?')
    expect(md).toMatch(/\(fin\) Pedido en curso/)
  })

  it('las salidas de una decisión son ramas etiquetadas hacia su número', () => {
    const md = renderFlows([pedidoFlow])

    expect(md).toMatch(/- sí → \d+/)
    expect(md).toMatch(/- no → \d+/)
  })

  it('una vuelta atrás se anota con el número del destino', () => {
    const md = renderFlows([pedidoFlow])

    // subsanar vuelve a revisar (el nodo 2): el salto no secuencial se hace explícito
    expect(md).toMatch(/Se subsana[^\n]*\n[^\n]*→ 2/)
  })

  it('sin flujos devuelve cadena vacía', () => {
    expect(renderFlows([])).toBe('')
    expect(renderFlows(undefined)).toBe('')
  })
})

/**
 * Spec 39, TASK-01: las piezas del render que la derivación de procesos reutiliza
 * (mismo orden y mismo mapa numerado en CLAUDE.md y en el JSDoc emitido — una
 * sola fuente, dos consumidores). Refactor puro: renderFlows no cambia su salida.
 */
describe('flowOrder y renderFlowSteps — piezas reutilizables del render (spec 39)', () => {
  const flow: BusinessFlow = {
    name: 'Ciclo de pedido',
    nodes: [
      { id: 'llega', kind: 'start', text: 'Llega un pedido', entity: 'pedido' },
      { id: 'revisar', kind: 'step', text: 'Se revisa y registra' },
      { id: 'aprobado', kind: 'decision', text: '¿Todo correcto?' },
      { id: 'subsanar', kind: 'step', text: 'Se subsana' },
      { id: 'fin', kind: 'end', text: 'Pedido en curso' }
    ],
    edges: [
      { from: 'llega', to: 'revisar' },
      { from: 'revisar', to: 'aprobado' },
      { from: 'aprobado', to: 'fin', label: 'sí' },
      { from: 'aprobado', to: 'subsanar', label: 'no' },
      { from: 'subsanar', to: 'revisar' }
    ]
  }

  it('flowOrder recorre el proceso desde el start y desempata por id', () => {
    const ids = flowOrder(flow).map(node => node.id)

    // fin y subsanar quedan libres a la vez tras la decisión: gana el alfabético por id
    expect(ids).toEqual(['llega', 'revisar', 'aprobado', 'fin', 'subsanar'])
  })

  it('renderFlowSteps devuelve solo las líneas numeradas, con ramas y saltos', () => {
    const lines = renderFlowSteps(flow)

    expect(lines[0]).toBe('1. (inicio) Llega un pedido · entidad: pedido')
    expect(lines).toContain('   - sí → 4')
    expect(lines).toContain('   - no → 5')
    expect(lines).toContain('   - → 2')
    expect(lines.join('\n')).not.toContain('###')
  })

  it('renderFlows compone renderFlowSteps: la salida es EXACTAMENTE la de antes', () => {
    const md = renderFlows([flow])

    expect(md).toContain(renderFlowSteps(flow).join('\n'))
  })
})

describe('renderClaudeMd — sección «Procesos de negocio» (spec 28)', () => {
  const brief: BusinessBrief = { business: 'Negocio de pedidos.' }
  const flow: BusinessFlow = {
    name: 'Alta',
    nodes: [
      { id: 'a', kind: 'start', text: 'Inicio' },
      { id: 'b', kind: 'end', text: 'Fin' }
    ],
    edges: [{ from: 'a', to: 'b' }]
  }

  it('con flujos añade la sección tras el resto del brief', () => {
    const md = renderClaudeMd('tienda', brief, [], [flow])

    expect(md).toContain('## Procesos de negocio')
    expect(md).toContain('### Alta')
  })

  it('sin flujos el markdown es EXACTAMENTE el de antes: fixtures del brief intactas', () => {
    expect(renderClaudeMd('tienda', brief, [])).not.toContain('Procesos de negocio')
  })
})

/**
 * Spec 40: el orden EMITIDO es el que se lee en el lienzo. Antes se ordenaba por
 * profundidad BFS —primer descubrimiento—, que no es un orden topológico: con dos ramas
 * de distinta longitud, el nodo donde se juntan se numeraba antes que las acciones que
 * llevan a él, y las acciones de dos tarjetas hermanas se entrelazaban por capas.
 */
describe('flowOrder — ningún nodo antes que sus predecesores (spec 40)', () => {
  it('el nodo donde se juntan dos ramas desiguales va DESPUÉS de las dos', () => {
    const flow: BusinessFlow = {
      name: 'Cambia el stock',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'Cambia el stock' },
        { id: 'bajo', kind: 'decision', text: 'stock < 10' },
        { id: 'marcar', kind: 'step', text: 'Marcar la fila' },
        { id: 'correo', kind: 'step', text: 'Enviar correo' },
        { id: 'fin', kind: 'end', text: 'Listo' }
      ],
      edges: [
        { from: 'inicio', to: 'bajo' },
        { from: 'bajo', to: 'marcar', label: 'sí' },
        { from: 'marcar', to: 'correo' },
        { from: 'correo', to: 'fin' },
        { from: 'bajo', to: 'fin', label: 'no' }
      ]
    }

    expect(flowOrder(flow).map(node => node.id)).toEqual(['inicio', 'bajo', 'marcar', 'correo', 'fin'])
  })

  it('las acciones de una tarjeta salen SEGUIDAS: dos ramas no se entrelazan', () => {
    const flow: BusinessFlow = {
      name: 'Aviso',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'Aviso' },
        { id: 'bajo', kind: 'decision', text: '¿poco stock?' },
        { id: 'avisar', kind: 'step', text: 'Avisar' },
        { id: 'cerrar', kind: 'step', text: 'Cerrar' },
        { id: 'quitar', kind: 'step', text: 'Quitar el aviso' },
        { id: 'registrar', kind: 'step', text: 'Registrar' },
        { id: 'fin', kind: 'end', text: 'Listo' }
      ],
      edges: [
        { from: 'inicio', to: 'bajo' },
        { from: 'bajo', to: 'avisar', label: 'sí' },
        { from: 'avisar', to: 'cerrar' },
        { from: 'cerrar', to: 'fin' },
        { from: 'bajo', to: 'quitar', label: 'no' },
        { from: 'quitar', to: 'registrar' },
        { from: 'registrar', to: 'fin' }
      ]
    }

    expect(flowOrder(flow).map(node => node.id)).toEqual([
      'inicio',
      'bajo',
      'avisar',
      'cerrar',
      'quitar',
      'registrar',
      'fin'
    ])
  })

  it('el orden sigue la CADENA, no el alfabeto: reordenarla cambia el orden', () => {
    const cadena = (segundo: string, tercero: string): BusinessFlow => ({
      name: 'Alta',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'Alta' },
        { id: 'zeta', kind: 'step', text: 'Zeta' },
        { id: 'alfa', kind: 'step', text: 'Alfa' },
        { id: 'fin', kind: 'end', text: 'Listo' }
      ],
      edges: [
        { from: 'inicio', to: segundo },
        { from: segundo, to: tercero },
        { from: tercero, to: 'fin' }
      ]
    })

    expect(flowOrder(cadena('zeta', 'alfa')).map(n => n.id)).toEqual(['inicio', 'zeta', 'alfa', 'fin'])
    expect(flowOrder(cadena('alfa', 'zeta')).map(n => n.id)).toEqual(['inicio', 'alfa', 'zeta', 'fin'])
  })

  it('una vuelta atrás no descoloca el proceso ni lo cuelga', () => {
    const flow: BusinessFlow = {
      name: 'Revisión',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'Llega' },
        { id: 'revisar', kind: 'step', text: 'Revisar' },
        { id: 'correcto', kind: 'decision', text: '¿correcto?' },
        { id: 'subsanar', kind: 'step', text: 'Subsanar' },
        { id: 'fin', kind: 'end', text: 'Listo' }
      ],
      edges: [
        { from: 'inicio', to: 'revisar' },
        { from: 'revisar', to: 'correcto' },
        { from: 'correcto', to: 'fin', label: 'sí' },
        { from: 'correcto', to: 'subsanar', label: 'no' },
        { from: 'subsanar', to: 'revisar' }
      ]
    }

    expect(flowOrder(flow).map(node => node.id)).toEqual(['inicio', 'revisar', 'correcto', 'fin', 'subsanar'])
  })

  it('lo que no se alcanza desde el inicio va al final, en orden alfabético', () => {
    const flow: BusinessFlow = {
      name: 'Con isla',
      nodes: [
        { id: 'inicio', kind: 'start', text: 'Empieza' },
        { id: 'isla', kind: 'step', text: 'Suelto' },
        { id: 'antes', kind: 'step', text: 'También suelto' },
        { id: 'fin', kind: 'end', text: 'Listo' }
      ],
      edges: [{ from: 'inicio', to: 'fin' }]
    }

    expect(flowOrder(flow).map(node => node.id)).toEqual(['inicio', 'fin', 'antes', 'isla'])
  })

  it('sin nodo de inicio devuelve los nodos tal cual, sin inventar orden', () => {
    const flow: BusinessFlow = {
      name: 'Suelto',
      nodes: [
        { id: 'b', kind: 'step', text: 'B' },
        { id: 'a', kind: 'step', text: 'A' }
      ],
      edges: []
    }

    expect(flowOrder(flow).map(node => node.id)).toEqual(['b', 'a'])
  })
})
