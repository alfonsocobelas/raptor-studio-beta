import { joinPathFragments, type Tree } from '@nx/devkit'
import * as path from 'path'
import type { AiSlotRef } from '../resource/ai-slots'

/**
 * El prompt de un hueco de paso (spec 39, TASK-11). Contexto ACOTADO y derivado del
 * propio emitido: la memoria del negocio, el mapa del flujo, el JSDoc del paso y las
 * firmas de los repositorios inyectados. Nada más — lo que no está aquí no puede
 * inventarse dentro del hueco. Todo el cálculo vive en esta función (regla 8).
 */
export function buildFlowSlotPrompt(tree: Tree, directory: string, slot: AiSlotRef): string {
  const source = tree.read(slot.file, 'utf-8')
  if (!source) throw new Error(`No se puede leer '${slot.file}'`)

  const step = findStep(source, slot.id)
  const repos = injectedRepos(tree, slot.file, source)

  return [
    `# Rellena el cuerpo del paso «${slot.id}»`,
    '',
    '## El negocio',
    '',
    businessMemory(tree, directory),
    '',
    '## El flujo al que pertenece el paso',
    '',
    classDoc(source),
    '',
    '## El paso',
    '',
    step.doc,
    '',
    `Firma: ${step.signature}`,
    `Hueco: entre \`// @ai:begin ${slot.id}\` y \`// @ai:end\`, dentro de ese método.`,
    '',
    '## Repositorios inyectados (lo único que puedes usar para tocar datos)',
    '',
    ...repos.map(repo => [`### ${repo.className} — \`this.${repo.propertyName}\``, '', ...repo.signatures, ''].join('\n')),
    '## Los agregados que devuelven esos repositorios (así se leen y se mutan)',
    '',
    ...repos.map(repo => aggregateSection(tree, repo).join('\n')),
    '## El contrato de la coreografía (no negociable)',
    '',
    '- El cuerpo debe ser AUTOSUFICIENTE: hace su parte del trabajo y termina.',
    '- Empieza por la guarda de estado: comprueba como precondición que la entidad está donde',
    '  este paso espera, y si no lo está, lanza. El paso no arregla el estado de otros.',
    '- NO invoques otros métodos de paso de esta clase: la secuencia la conduce una persona,',
    '  no el código. Encadenarlos rompe la coreografía.',
    '- NO escribas nada fuera del hueco: ni imports, ni campos, ni otros métodos. Cualquier',
    '  edición fuera de los marcadores invalida el resultado.',
    '- Usa solo los repositorios de arriba y sus firmas tal y como están.'
  ].join('\n')
}

interface InjectedRepo {
  className: string
  propertyName: string
  /** Líneas `abstract …` del puerto, sin marcadores ni ruido */
  signatures: string[]
  /** Ruta del puerto en el árbol: por ahí se llega al agregado */
  portPath?: string
}

/**
 * La superficie pública del agregado: getters y firmas de métodos, más el tipo que toma
 * `updateDetails`. Sin esto quien rellena no puede dejar la entidad en el estado que pide
 * el paso —lo adivina y el gate lo rechaza—, que es justo lo que pasó al rellenar de
 * verdad. Entran FIRMAS, nunca cuerpos: el cómo lo decide el dominio, no el hueco.
 */
function aggregateSection(tree: Tree, repo: InjectedRepo): string[] {
  const className = repo.className.replace(/Repository$/, '')
  const port = repo.portPath ? (tree.read(repo.portPath, 'utf-8') ?? '') : ''
  const aggregatePath = resolveImport(port, className, repo.portPath)
  const source = aggregatePath ? (tree.read(aggregatePath, 'utf-8') ?? '') : ''
  if (!source) return []

  const signatures = source
    .split('\n')
    .map(line => line.trim())
    // `get x(): T {` y `metodo(args): T {` de primer nivel; nada de privados ni cuerpos
    .filter(line => /^(get [a-z]\w*\(\)|static \w+\(|[a-z]\w*\()/.test(line))
    // lo que parece una firma y no lo es: llamadas y palabras de control
    .filter(line => !/^(super|constructor|if|for|while|switch|catch|return|throw|await)\b/.test(line))
    .map(line => line.replace(/\s*\{$/, ''))

  const updateProps = `${className}UpdateProps`
  const typesPath = resolveImport(source, updateProps, aggregatePath)
  const types = typesPath ? (tree.read(typesPath, 'utf-8') ?? '') : ''
  const declaration = types.match(new RegExp(`export type ${updateProps} =[\\s\\S]*?\\n(?=\\n|export |$)`))?.[0].trim()

  return [`### ${className}`, '', ...signatures, ...(declaration ? ['', declaration] : []), '']
}

/** La ruta del fichero que exporta `symbol`, resuelta desde los imports de `source`. */
function resolveImport(source: string, symbol: string, from?: string): string | undefined {
  if (!from) return undefined
  const importPath = source.match(new RegExp(`import \\{[^}]*\\b${symbol}\\b[^}]*\\} from '([^']+)'`))?.[1]

  return importPath ? `${path.join(path.dirname(from), importPath)}.ts` : undefined
}

/**
 * La memoria del negocio emitida, menos su sección de procesos: el mapa llega acotado
 * al flujo de este paso por el JSDoc de la clase, y repetir todos los flujos de la app
 * ensancharía el contexto justo donde se pide que sea estrecho.
 */
function businessMemory(tree: Tree, directory: string): string {
  const claudeMd = tree.read(joinPathFragments(directory, 'CLAUDE.md'), 'utf-8')
  if (!claudeMd) return '(la app no trae memoria de negocio)'

  return claudeMd.split(/^## Procesos de negocio$/m)[0].trim()
}

/** El JSDoc de la clase: nombre del flujo, descripción y mapa numerado BFS. */
function classDoc(source: string): string {
  const block = source.match(/\/\*\*\n([\s\S]*?)\*\/\s*(?:@Injectable\(\)\s*)?export class/)
  return block ? stripJsDoc(block[1]) : '(sin mapa del flujo)'
}

/**
 * El paso dueño del hueco: su JSDoc y su firma. Se busca desde el marcador hacia atrás
 * porque es el hueco quien identifica al método, no al revés (dos pasos pueden compartir
 * texto, nunca id de hueco).
 */
function findStep(source: string, id: string): { doc: string; signature: string } {
  const marker = source.indexOf(`// @ai:begin ${id}`)
  if (marker === -1) throw new Error(`El hueco '${id}' no está en el fichero`)

  const before = source.slice(0, marker)
  // la ÚLTIMA firma antes del marcador, línea a línea: un patrón sobre todo el texto
  // se traga desde el primer `async` del fichero hasta este hueco (visto al inspeccionar
  // un prompt real; los `toContain` no lo delataban porque la firma buena era su cola)
  const signature = [...before.matchAll(/^[ \t]*(async [^\n]*?)\s*\{[ \t]*$/gm)].pop()?.[1] ?? '(firma no encontrada)'
  // el ÚLTIMO bloque JSDoc antes del marcador es el del método que contiene el hueco
  const docs = [...before.matchAll(/\/\*\*\n([\s\S]*?)\*\//g)]
  const doc = docs.length ? stripJsDoc(docs[docs.length - 1][1]) : '(sin JSDoc del paso)'

  return { doc, signature }
}

/**
 * Los repositorios del constructor, con las firmas de su puerto. La ruta sale del import
 * del propio fichero: así el prompt cita el puerto REAL del emitido y no una suposición.
 */
function injectedRepos(tree: Tree, file: string, source: string): InjectedRepo[] {
  const ctor = source.match(/constructor\(([\s\S]*?)\)\s*\{\}/)?.[1] ?? ''

  return [...ctor.matchAll(/private readonly (\w+): (\w+)/g)].map(([, propertyName, className]) => {
    const importPath = source.match(new RegExp(`import \\{ ${className} \\} from '([^']+)'`))?.[1]
    const resolved = importPath ? `${path.join(path.dirname(file), importPath)}.ts` : undefined
    const port = resolved ? (tree.read(resolved, 'utf-8') ?? '') : ''

    return {
      className,
      propertyName,
      portPath: resolved,
      signatures: port
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('abstract '))
    }
  })
}

/** ` * texto` → `texto`, conservando la sangría relativa del mapa. */
function stripJsDoc(block: string): string {
  return block
    .split('\n')
    .map(line => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim()
}
