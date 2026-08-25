import { generateFiles, names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { resolveAccess, type BusinessFlow, type FlowNode, type ResourceDefinition } from '@raptor/schema'
import { rolesArgs } from '../resource/build-entrypoints'
import { harvestAiSlots, reinjectAiSlots } from '../resource/ai-slots'
import { flowOrder, renderFlowSteps } from './brief-doc'

/**
 * Derivación de la clase de proceso que emite un flujo (spec 39). El flujo NO se
 * ejecuta (regla 7): la clase es una coreografía documentada — cada método es un punto
 * de entrada independiente y la secuencia vive solo en el JSDoc. Toda la lógica está
 * aquí (regla 8): la plantilla solo interpola.
 */
export interface FlowProcessNames {
  /** Carpeta y fichero: nombre del flujo en kebab sin acentos ('de-presupuesto-a-legalizacion') */
  fileName: string
  /** Clase emitida: PascalCase + sufijo ('DePresupuestoALegalizacionProcess') */
  className: string
  /** Controller de los pasos convergidos ('DePresupuestoALegalizacionController') */
  controllerClassName: string
}

export interface FlowStepMethod {
  /** Id del nodo en camelCase ('planifica-montaje' → 'planificaMontaje') */
  methodName: string
  /** Firma estable (el harvest no cubre firmas): 'id: InstalacionId' si el nodo cita entidad; si no, '' */
  params: string
  /** JSDoc del método: número de paso, texto, procedencia (con rama etiquetada) y destino */
  docLines: string[]
  node: FlowNode
}

export interface FlowRepoDep {
  entity: string
  /** Repositorio de dominio del canon ('InstalacionRepository') */
  className: string
  /** Nombre de la propiedad inyectada ('instalacionRepository') */
  propertyName: string
}

export function flowProcessNames(flow: BusinessFlow): FlowProcessNames {
  const plain = asciiWords(flow.name)
  return {
    fileName: names(plain).fileName,
    className: `${names(plain).className}Process`,
    controllerClassName: `${names(plain).className}Controller`
  }
}

/** Solo los nodos `step` derivan método, en el orden del proceso (el mismo del mapa del CLAUDE.md). */
export function flowStepMethods(flow: BusinessFlow): FlowStepMethod[] {
  const order = flowOrder(flow)
  const numberOf = new Map(order.map((node, i) => [node.id, i + 1]))
  const nodeOf = new Map(order.map(node => [node.id, node]))

  const describe = (id: string) => `${numberOf.get(id)}. ${nodeOf.get(id)?.text}`
  return order
    .filter(node => node.kind === 'step')
    .map(node => {
      const docLines = [`Paso ${numberOf.get(node.id)} — ${node.text}`]
      // el estado en que debe quedar la entidad: es la precondición y el efecto del paso,
      // y lo que necesita saber quien escriba el cuerpo (spec 39, punto 1)
      if (node.status) docLines.push(`Deja ${node.entity} en estado: ${node.status}`)
      // convergencia (spec 44): el paso ejecuta un verbo de la máquina — el cuerpo es real
      if (node.transition) docLines.push(`Ejecuta la transición «${node.transition}» de ${node.entity}`)
      for (const edge of flow.edges) {
        if (edge.to !== node.id || !numberOf.has(edge.from)) continue
        const branch = edge.label !== undefined ? ` (rama «${edge.label}»)` : ''
        docLines.push(`Viene de: ${describe(edge.from)}${branch}`)
      }
      for (const edge of flow.edges) {
        if (edge.from !== node.id || !numberOf.has(edge.to)) continue
        const branch = edge.label !== undefined ? ` (rama «${edge.label}»)` : ''
        docLines.push(`Va a: ${describe(edge.to)}${branch}`)
      }
      return {
        methodName: names(node.id).propertyName,
        params: node.entity ? `id: ${names(node.entity).className}Id` : '',
        docLines,
        node
      }
    })
}

/** Cabecera JSDoc de la clase: nombre, descripción y el mapa numerado de renderFlowSteps (una sola fuente). */
export function flowClassDoc(flow: BusinessFlow): string[] {
  return [flow.name, '', ...(flow.description ? [flow.description, ''] : []), ...renderFlowSteps(flow)]
}

/**
 * Emite la carpeta processes/ de cada contexto citado: una clase por flujo y su
 * processes.module.ts. El contexto de un flujo es el de la primera entidad que cita
 * (fallback: el del primer modelo). Solo se llama con flujos: sin ellos, ni carpeta.
 */
export function emitFlowProcesses(
  tree: Tree,
  backendSrc: string,
  flows: BusinessFlow[],
  models: ResourceDefinition[],
  sharedDomainAlias: string
): void {
  const pluralOf = new Map(models.map(model => [model.name, model.plural]))
  const contextOf = new Map(models.map(model => [model.name, model.context]))
  // los roles del endpoint convergido son los del VERBO que ejecuta (spec 46): misma matriz
  // que el endpoint de la transición del recurso — divergencia imposible
  const transitionRolesOf = new Map(models.map(model => [model.name, resolveAccess(model).transitions]))

  const byContext = new Map<string, BusinessFlow[]>()
  for (const flow of flows) {
    const anchor = flowOrder(flow).find(node => node.entity)?.entity
    const ctx = (anchor ? contextOf.get(anchor) : undefined) ?? models[0].context
    byContext.set(ctx, [...(byContext.get(ctx) ?? []), flow])
  }

  for (const [ctx, ctxFlows] of byContext) {
    const processesDir = path.join(backendSrc, 'contexts', ctx, 'processes')
    // supervivencia (TASK-07): lo escrito a mano en los huecos flow-* se cosecha del
    // árbol anterior y se reinyecta tras regenerar — mismo mecanismo que el recurso
    const survivors = harvestAiSlots(tree, processesDir)

    // el módulo lista TODOS los procesos del contexto: mismas substitutions en cada pasada (idempotente)
    const processNames = ctxFlows.map(flowProcessNames)
    const entities = [...new Set(ctxFlows.flatMap(flow => flowRepoDeps(flow).map(dep => dep.entity)))]
    // convergencia (spec 44): controllers solo para los flujos con pasos convergidos
    const withController = ctxFlows.filter(flow => flowStepMethods(flow).some(m => m.node.transition))
    const controllerNames = withController.map(flowProcessNames)
    const moduleSubstitutions = {
      controllerImports: controllerNames
        .map(p => `import { ${p.controllerClassName} } from './${p.fileName}/${p.fileName}.controller'`)
        .join('\n'),
      controllerNames: controllerNames.map(p => p.controllerClassName).join(', '),
      moduleImports: entities
        .map(entity => {
          const plural = pluralOf.get(entity)
          return `import { ${names(plural ?? entity).className}Module } from '../modules/${plural}/${plural}.module'`
        })
        .join('\n'),
      processImports: processNames
        .map(p => `import { ${p.className} } from './${p.fileName}/${p.fileName}.process'`)
        .join('\n'),
      entityModules: entities.map(entity => `${names(pluralOf.get(entity) ?? entity).className}Module`).join(', '),
      processProviders: processNames.map(p => p.className).join(', ')
    }

    for (const flow of ctxFlows) {
      const { fileName, className, controllerClassName } = flowProcessNames(flow)
      const methods = flowStepMethods(flow)
      const deps = flowRepoDeps(flow)
      const converged = methods.filter(m => m.node.transition && m.node.entity)

      const idImports = [...new Set(methods.map(m => m.node.entity).filter((e): e is string => Boolean(e)))].map(
        entity => {
          const n = names(entity)
          return `import { ${n.className}Id } from '../../../shared/domain/value-objects/${pluralOf.get(entity)}/${n.fileName}-id.vo'`
        }
      )
      // convergencia (spec 44): los pasos con cuerpo real cargan por id y pueden no encontrar
      const errorImports = methods.some(m => m.node.transition)
        ? [`import { EntityNotFoundError } from '../../../shared/domain/errors'`]
        : []
      const repoImports = deps.map(dep => {
        const n = names(dep.entity)
        return `import { ${dep.className} } from '../../modules/${pluralOf.get(dep.entity)}/domain/${n.fileName}-repository'`
      })

      generateFiles(tree, path.join(__dirname, 'files-flow-process'), processesDir, {
        ...moduleSubstitutions,
        flowFileName: fileName,
        className,
        imports: [...errorImports, ...idImports, ...repoImports].join('\n'),
        classDoc: docBlock(flowClassDoc(flow)),
        ctorParams: deps.map(dep => `private readonly ${dep.propertyName}: ${dep.className}`).join(', '),
        methodsBlock: methods.map(renderMethod).join('\n\n'),
        controllerClassName,
        // el alias es el de la APP emitida, nunca el del modelo: los modelos de referencia
        // apuntan a su workspace de origen y dejarían el controller sin compilar (TS2307)
        sharedDomainAlias,
        controllerIdImports: [...new Set(converged.map(m => m.node.entity as string))]
          .map(entity => {
            const n = names(entity)
            return `import { ${n.className}Id } from '../../../shared/domain/value-objects/${pluralOf.get(entity)}/${n.fileName}-id.vo'`
          })
          .join('\n'),
        controllerMethods: converged
          .map(method =>
            renderControllerMethod(
              method,
              rolesArgs(
                transitionRolesOf.get(method.node.entity as string)?.[method.node.transition as string] ?? ['user']
              )
            )
          )
          .join('\n')
      })
      // sin pasos convergidos no hay controller: nada de fachadas sobre huecos (spec 44)
      if (!converged.length) {
        tree.delete(path.join(processesDir, fileName, `${fileName}.controller.ts`))
      }
    }

    reinjectAiSlots(tree, processesDir, survivors)
  }

  registerInRoot(tree, backendSrc, [...byContext.keys()])
}

/**
 * Cablea cada ProcessesModule en el composition root que emitió el generador de root
 * (mismo patrón de parcheo que el plugin de auth: ancla en HealthModule, que vale
 * tanto si prettier deja el array `imports` en una línea como en varias). Con más de
 * un contexto las clases son homónimas: se importan con alias por contexto.
 */
function registerInRoot(tree: Tree, backendSrc: string, contexts: string[]): void {
  const rootPath = path.join(backendSrc, 'root.module.ts')
  const source = tree.read(rootPath, 'utf-8')
  if (!source || source.includes('ProcessesModule')) return

  const entries = contexts.map(ctx => ({
    localName: contexts.length === 1 ? 'ProcessesModule' : `${names(ctx).className}ProcessesModule`,
    importPath: `./contexts/${ctx}/processes/processes.module`
  }))
  const importLines = entries
    .map(entry => {
      const clause = entry.localName === 'ProcessesModule' ? 'ProcessesModule' : `ProcessesModule as ${entry.localName}`
      return `import { ${clause} } from '${entry.importPath}'\n`
    })
    .join('')

  const wired = source
    .replace(/(import \{ HealthModule \}[^\n]*\n)/, `$1${importLines}`)
    .replace(/HealthModule,(\s*)/, (_, sep: string) => `HealthModule,${sep}${entries.map(e => `${e.localName},${sep}`).join('')}`)
  tree.write(rootPath, wired)
}

/**
 * El cuerpo de cada paso es un hueco @ai vacío (spec 39) SALVO que el paso declare una
 * transición (spec 44): entonces el cuerpo es real — cargar → verbo del agregado →
 * guardar. La guarda vive en el verbo (spec 43); el paso no la duplica, y por eso no
 * lleva hueco: no queda nada que rellenar.
 */
function renderMethod(method: FlowStepMethod): string {
  const head = ['  /**', ...method.docLines.map(line => `   * ${line}`), '   */']

  if (method.node.transition && method.node.entity) {
    const n = names(method.node.entity)
    const verb = names(method.node.transition).propertyName
    return [
      ...head,
      `  async ${method.methodName}(${method.params}): Promise<void> {`,
      `    const ${n.propertyName} = await this.${n.propertyName}Repository.get(id)`,
      `    if (!${n.propertyName}) {`,
      `      throw new EntityNotFoundError('${n.className}', id.value)`,
      `    }`,
      `    ${n.propertyName}.${verb}()`,
      `    await this.${n.propertyName}Repository.save(${n.propertyName})`,
      '  }'
    ].join('\n')
  }

  return [
    ...head,
    `  async ${method.methodName}(${method.params}): Promise<void> {`,
    `    // @ai:begin flow-${method.node.id} — ${method.node.text}`,
    '    // @ai:end',
    '  }'
  ].join('\n')
}

/** La ruta de un paso convergido: POST processes/<flujo>/<nodo>/:id → 204 (409/404 del filtro global). */
function renderControllerMethod(method: FlowStepMethod, roles: string): string {
  const entity = names(method.node.entity as string)
  return [
    '',
    '  /** ' + method.docLines[0] + ` · transición «${method.node.transition}» de ${method.node.entity}. */`,
    `  @Post('${method.node.id}/:id')`,
    `  @Roles(${roles})`,
    '  @HttpCode(HttpStatus.NO_CONTENT)',
    `  ${method.methodName}(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {`,
    `    return this.process.${method.methodName}(${entity.className}Id.create(id))`,
    '  }'
  ].join('\n')
}

function docBlock(lines: string[]): string {
  return lines.map(line => (line ? ` * ${line}` : ' *')).join('\n')
}

/**
 * Repositorios que inyecta el constructor: uno por entidad citada por CUALQUIER nodo
 * del flujo (también start/end/decision), deduplicados, en orden de primera aparición BFS.
 */
export function flowRepoDeps(flow: BusinessFlow): FlowRepoDep[] {
  const seen = new Set<string>()
  const deps: FlowRepoDep[] = []
  for (const node of flowOrder(flow)) {
    if (!node.entity || seen.has(node.entity)) continue
    seen.add(node.entity)
    const n = names(node.entity)
    deps.push({ entity: node.entity, className: `${n.className}Repository`, propertyName: `${n.propertyName}Repository` })
  }
  return deps
}

/** «legalización» → 'legalizacion': el nombre del flujo es prosa; el fichero, ASCII. */
function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * El nombre del flujo lo escribe una persona: llega con acentos y con separadores (\u00abJOB \u00b7
 * \u00d3rdenes\u2026\u00bb, \u00abFase I / II\u00bb) que `names()` cuela tal cual en la ruta emitida. Se reduce a
 * palabras ASCII antes de derivar fichero y clase para que la carpeta siga siendo kebab.
 */
function asciiWords(text: string): string {
  return stripDiacritics(text)
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
}
