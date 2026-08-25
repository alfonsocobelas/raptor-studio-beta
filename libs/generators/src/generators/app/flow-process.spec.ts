import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { BusinessFlow } from '@raptor/schema'
import { appGenerator } from './app'
import { flowClassDoc, flowProcessNames, flowRepoDeps, flowStepMethods } from './flow-process'
import { MODELS } from '../resource/models/registry'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

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

  it('el nombre del fichero es ASCII kebab aunque el flujo lleve puntuación', () => {
    // los nombres reales del estudio llevan separadores («JOB · Órdenes paradas…») y
    // Nx los cuela tal cual en la ruta: quedaba la carpeta 'job-·-ordenes-paradas…',
    // fuera de la convención kebab y con un carácter no ASCII en disco (demo taller)
    const derived = flowProcessNames({ ...flow, name: 'JOB · Órdenes paradas por recambio' })

    expect(derived.fileName).toBe('job-ordenes-paradas-por-recambio')
    // la clase ya salía limpia (Nx tira la puntuación al pasar a PascalCase)
    expect(derived.className).toBe('JOBOrdenesParadasPorRecambioProcess')
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

/**
 * Spec 39, TASK-05: el generador de app emite, por cada flujo, la clase de proceso
 * con huecos flow-* vacíos y el processes.module.ts. Sin flujos, ni carpeta ni módulo.
 */
describe('app generator — los flujos emiten proceso (spec 39)', () => {
  const writeAppFile = (flows?: BusinessFlow[], resources = ['garment']): { dir: string; appFile: string } => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'acc-flows-'))
    const appFile = path.join(dir, 'demo.app.json')
    fs.writeFileSync(
      appFile,
      JSON.stringify({
        schemaVersion: 1,
        name: 'demo',
        pages: resources.map(resource => ({ kind: 'resource', resource })),
        resources: resources.map(resource => MODELS[resource]),
        ...(flows ? { flows } : {})
      })
    )
    return { dir, appFile }
  }

  const pedidoFlow: BusinessFlow = {
    name: 'Ciclo de pedido',
    description: 'Del alta a la aprobación.',
    nodes: [
      { id: 'llega', kind: 'start', text: 'Llega un pedido' },
      { id: 'revisar', kind: 'step', text: 'Se revisa y registra', entity: 'garment' },
      { id: 'ok', kind: 'decision', text: '¿Todo correcto?' },
      { id: 'subsanar', kind: 'step', text: 'Se subsana' },
      { id: 'fin', kind: 'end', text: 'Pedido en curso' }
    ],
    edges: [
      { from: 'llega', to: 'revisar' },
      { from: 'revisar', to: 'ok' },
      { from: 'ok', to: 'fin', label: 'sí' },
      { from: 'ok', to: 'subsanar', label: 'no' },
      { from: 'subsanar', to: 'revisar' }
    ]
  }

  const generate = async (flows?: BusinessFlow[], resources?: string[]): Promise<Tree> => {
    const { dir, appFile } = writeAppFile(flows, resources)
    try {
      const tree: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, { name: 'demo', appFile, skipInstall: true })
      return tree
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }

  const PROCESS_PATH = 'apps/demo/libs/backend/src/contexts/warehouse/processes/ciclo-de-pedido/ciclo-de-pedido.process.ts'
  const MODULE_PATH = 'apps/demo/libs/backend/src/contexts/warehouse/processes/processes.module.ts'

  it('emite la clase de proceso en el contexto de la entidad citada', async () => {
    const tree = await generate([pedidoFlow])
    const emitted = tree.read(PROCESS_PATH, 'utf-8') ?? ''

    expect(emitted).toContain('export class CicloDePedidoProcess')
    expect(emitted).toContain('constructor(private readonly garmentRepository: GarmentRepository) {}')
    expect(emitted).toContain("import { GarmentRepository } from '../../modules/garments/domain/garment-repository'")
    expect(emitted).toContain("import { GarmentId } from '../../../shared/domain/value-objects/garments/garment-id.vo'")
  })

  it('el controller importa los roles del alias de la APP, no del alias del modelo (defecto cazado en spec 60)', async () => {
    // contract declara sharedDomainAlias '@sap-licenses/…' (workspace de referencia); en la
    // app emitida el alias real es '@app/…' y usar el del modelo deja el emitido sin compilar
    const contratoFlow: BusinessFlow = {
      name: 'Alta de contrato',
      nodes: [
        { id: 'llega', kind: 'start', text: 'Llega un contrato' },
        { id: 'revisar', kind: 'step', text: 'Se termina', entity: 'contract', transition: 'terminate' },
        { id: 'fin', kind: 'end', text: 'Contrato en curso' }
      ],
      edges: [
        { from: 'llega', to: 'revisar' },
        { from: 'revisar', to: 'fin' }
      ]
    }
    const tree = await generate([contratoFlow], ['customer', 'contract'])
    const controller = tree.read(
      'apps/demo/libs/backend/src/contexts/sap-licensing/processes/alta-de-contrato/alta-de-contrato.controller.ts',
      'utf-8'
    ) ?? ''

    expect(controller).toContain("from '@app/shared/domain'")
    expect(controller).not.toContain('@sap-licenses')
  })

  it('cada step es un método con su hueco flow-* vacío; start/end/decision no emiten método', async () => {
    const tree = await generate([pedidoFlow])
    const emitted = tree.read(PROCESS_PATH, 'utf-8') ?? ''

    expect(emitted).toContain('async revisar(id: GarmentId): Promise<void> {')
    expect(emitted).toContain('async subsanar(): Promise<void> {')
    expect(emitted).toContain('// @ai:begin flow-revisar — Se revisa y registra')
    expect(emitted).toContain('// @ai:begin flow-subsanar — Se subsana')
    expect(emitted).not.toContain('async llega')
    expect(emitted).not.toContain('async ok')
    expect(emitted).not.toContain('async fin')
  })

  it('la cabecera lleva el mapa BFS y cada método su paso, procedencia y destino', async () => {
    const tree = await generate([pedidoFlow])
    const emitted = tree.read(PROCESS_PATH, 'utf-8') ?? ''

    expect(emitted).toContain(' * Ciclo de pedido')
    expect(emitted).toContain(' * 1. (inicio) Llega un pedido')
    expect(emitted).toContain(' * Paso 2 — Se revisa y registra')
    expect(emitted).toContain(' * Viene de: 3. ¿Todo correcto? (rama «no»)')
  })

  it('emite processes.module.ts con el proceso como provider e importa los módulos citados', async () => {
    const tree = await generate([pedidoFlow])
    const emitted = tree.read(MODULE_PATH, 'utf-8') ?? ''

    expect(emitted).toContain('export class ProcessesModule')
    expect(emitted).toContain("import { GarmentsModule } from '../modules/garments/garments.module'")
    expect(emitted).toContain("import { CicloDePedidoProcess } from './ciclo-de-pedido/ciclo-de-pedido.process'")
    expect(emitted).toContain('providers: [CicloDePedidoProcess]')
  })

  it('sin flujos no se emite la carpeta processes/', async () => {
    const tree = await generate()

    expect(tree.exists(MODULE_PATH)).toBe(false)
    expect(tree.children('apps/demo/libs/backend/src/contexts/warehouse')).not.toContain('processes')
  })

  /**
   * Spec 39, TASK-09: el criterio de aceptación de la demo solaris, fijado como test
   * (el gate de compilación vive en tools/typecheck-emitted.sh, que no mira la forma).
   * Los nombres de clase salen de los modelos registrados —`installation`/`worklog`—,
   * no de la prosa del REQUIREMENTS, que los citaba en español.
   */
  it('la demo solaris emite los 5 pasos y los 2 repos del flujo de legalización', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'solaris', app: 'solaris', skipInstall: true })

    const emitted =
      tree.read(
        'apps/solaris/libs/backend/src/contexts/solaris/processes/de-presupuesto-a-legalizacion/de-presupuesto-a-legalizacion.process.ts',
        'utf-8'
      ) ?? ''

    // los 5 nodos step del flujo, y solo ellos
    expect(emitted.match(/^  async \w+\(/gm)?.map(m => m.trim())).toEqual([
      'async presupuesto(',
      'async planifica(',
      'async montaje(',
      'async averia(',
      'async cie('
    ])
    // dos entidades citadas → dos repos inyectados, en orden de primera aparición BFS.
    // Se lee la lista de parámetros, no el texto literal: el árbol de test no pasa por
    // prettier (la fixture de oro sí), así que el salto de línea del constructor difiere.
    const ctor = emitted.match(/constructor\(([\s\S]*?)\) \{\}/)?.[1] ?? ''
    expect(ctor.match(/private readonly \w+: \w+/g)).toEqual([
      'private readonly installationRepository: InstallationRepository',
      'private readonly worklogRepository: WorklogRepository'
    ])
    // y los 5 huecos nacen vacíos: el relleno es el bloque B de la spec
    expect(emitted.match(/@ai:begin flow-/g)).toHaveLength(5)
  })

  /**
   * Spec 39, TASK-07: supervivencia. Lo escrito a mano dentro de un hueco flow-*
   * sobrevive a la regeneración por el mecanismo existente de ai-slots.ts
   * (harvest antes de emitir, reinyección después), sin cambios en su código.
   */
  it('el texto escrito a mano en un hueco flow-* sobrevive a la regeneración', async () => {
    // GIVEN: una app emitida con un hueco flow-revisar relleno a mano
    const { dir, appFile } = writeAppFile([pedidoFlow])
    try {
      const tree: Tree = createTreeWithEmptyWorkspace()
      await appGenerator(tree, { name: 'demo', appFile, skipInstall: true })

      const manual = '    const garment = await this.garmentRepository.findById(id)\n'
      const filled = (tree.read(PROCESS_PATH, 'utf-8') ?? '').replace(
        /(\/\/ @ai:begin flow-revisar[^\n]*\n)/,
        `$1${manual}`
      )
      tree.write(PROCESS_PATH, filled)

      // WHEN: se regenera la app sobre el mismo árbol
      await appGenerator(tree, { name: 'demo', appFile, skipInstall: true })

      // THEN: el hueco conserva el cuerpo manual y los demás siguen vacíos
      const regenerated = tree.read(PROCESS_PATH, 'utf-8') ?? ''
      expect(regenerated).toContain('await this.garmentRepository.findById(id)')
      expect(regenerated).toContain('// @ai:begin flow-subsanar — Se subsana')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  /**
   * Spec 39, TASK-06: cableado de módulos. El ProcessesModule se registra en el
   * composition root (mismo patrón de parcheo que el plugin de auth) y puede inyectar
   * los repositorios porque cada módulo de entidad los exporta.
   */
  describe('cableado de módulos (TASK-06)', () => {
    const ROOT_PATH = 'apps/demo/libs/backend/src/root.module.ts'

    it('registra ProcessesModule en el root.module del backend', async () => {
      const tree = await generate([pedidoFlow])
      const root = tree.read(ROOT_PATH, 'utf-8') ?? ''

      expect(root).toContain("import { ProcessesModule } from './contexts/warehouse/processes/processes.module'")
      expect(root).toMatch(/imports: \[[^\]]*ProcessesModule/)
    })

    it('sin flujos el root.module no menciona ProcessesModule', async () => {
      const tree = await generate()

      expect(tree.read(ROOT_PATH, 'utf-8') ?? '').not.toContain('ProcessesModule')
    })

    it('el módulo de la entidad citada exporta su repositorio (inyectable desde processes/)', async () => {
      const tree = await generate([pedidoFlow])
      const garmentsModule =
        tree.read('apps/demo/libs/backend/src/contexts/warehouse/modules/garments/garments.module.ts', 'utf-8') ?? ''

      expect(garmentsModule).toContain('exports: [GarmentRepository]')
    })

    it('con flujos en dos contextos, cada ProcessesModule entra con alias propio', async () => {
      // GIVEN: un flujo por contexto (garment → warehouse, material → solaris)
      const materialFlow: BusinessFlow = {
        name: 'Alta de material',
        nodes: [
          { id: 'llega-material', kind: 'start', text: 'Llega material' },
          { id: 'registrar', kind: 'step', text: 'Se registra', entity: 'material' },
          { id: 'fin-alta', kind: 'end', text: 'Material dado de alta' }
        ],
        edges: [
          { from: 'llega-material', to: 'registrar' },
          { from: 'registrar', to: 'fin-alta' }
        ]
      }

      // WHEN
      const tree = await generate([pedidoFlow, materialFlow], ['garment', 'material'])
      const root = tree.read(ROOT_PATH, 'utf-8') ?? ''

      // THEN: dos clases homónimas no pueden importarse sin alias
      expect(root).toContain(
        "import { ProcessesModule as WarehouseProcessesModule } from './contexts/warehouse/processes/processes.module'"
      )
      expect(root).toContain(
        "import { ProcessesModule as SolarisProcessesModule } from './contexts/solaris/processes/processes.module'"
      )
      expect(root).toMatch(/imports: \[[^\]]*WarehouseProcessesModule/)
      expect(root).toMatch(/imports: \[[^\]]*SolarisProcessesModule/)
    })
  })
})

/**
 * Spec 40: el orden de los métodos emitidos es el de la CADENA del lienzo. Reordenar las
 * acciones en el estudio cambia esa cadena, y el código emitido tiene que seguirla: si no,
 * el gesto de arrastrar una fila sería mentira en cuanto se generase la app.
 */
describe('flow-process — los métodos salen en el orden de la cadena (spec 40)', () => {
  const conRamas = (primeraRama: string[]): BusinessFlow => ({
    name: 'Aviso de stock bajo',
    nodes: [
      { id: 'cambia', kind: 'start', text: 'Cambia el stock' },
      { id: 'bajo', kind: 'decision', text: '¿stock < 10?' },
      { id: 'avisar', kind: 'step', text: 'Avisar a compras' },
      { id: 'cerrar', kind: 'step', text: 'Cerrar el aviso' },
      { id: 'quitar', kind: 'step', text: 'Quitar la marca' },
      { id: 'fin', kind: 'end', text: 'Listo' }
    ],
    edges: [
      { from: 'cambia', to: 'bajo' },
      { from: 'bajo', to: primeraRama[0], label: 'sí' },
      { from: primeraRama[0], to: primeraRama[1] },
      { from: primeraRama[1], to: 'fin' },
      { from: 'bajo', to: 'quitar', label: 'no' },
      { from: 'quitar', to: 'fin' }
    ]
  })

  it('las acciones de una tarjeta salen SEGUIDAS, sin colar la de la otra rama', () => {
    const methods = flowStepMethods(conRamas(['avisar', 'cerrar']))

    expect(methods.map(method => method.methodName)).toEqual(['avisar', 'cerrar', 'quitar'])
  })

  it('reordenar la cadena reordena los métodos: manda la cadena, no el alfabeto', () => {
    const methods = flowStepMethods(conRamas(['cerrar', 'avisar']))

    expect(methods.map(method => method.methodName)).toEqual(['cerrar', 'avisar', 'quitar'])
  })

  it('la numeración del JSDoc sigue el mismo orden: el fin va detrás de las dos ramas', () => {
    const methods = flowStepMethods(conRamas(['avisar', 'cerrar']))
    const numeros = methods.map(method => method.docLines[0])

    expect(numeros).toEqual(['Paso 3 — Avisar a compras', 'Paso 4 — Cerrar el aviso', 'Paso 5 — Quitar la marca'])
    // y el destino común se numera después de la última acción, no antes
    expect(methods[2].docLines).toContain('Va a: 6. Listo')
  })
})
