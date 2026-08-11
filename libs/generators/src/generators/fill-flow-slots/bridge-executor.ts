import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import * as path from 'path'
import { type AiSlotRef, replaceSlotBody } from '../resource/ai-slots'
import type { SlotExecutor } from './fill-flow-slots'

export interface BridgeOptions {
  /** 15 min por defecto, como el puente del chat: pensar un paso de negocio lleva minutos */
  timeoutMs?: number
  pollMs?: number
}

/** Lo que deja quien responde: el fichero entero, o solo el cuerpo del hueco. */
interface BridgeResponse {
  file?: string
  body?: string
}

/**
 * Ejecutor PUENTE (spec 39, TASK-13): escribe la petición como fichero y espera a que
 * una sesión de Claude Code que vigila el directorio deposite la respuesta. Mismo
 * protocolo que el puente del chat del estudio, y por el mismo motivo: el generador no
 * lleva IA dentro (ADR: la IA vive en los bordes), así que aquí no hay SDK ni clave.
 *
 * La respuesta puede traer el fichero candidato completo —que es lo que de verdad hace
 * una sesión editando— o solo el cuerpo del hueco. En los dos casos lo que devuelve es
 * un candidato que la frontera de escritura tendrá que aprobar.
 */
export function bridgeSlotExecutor(dir: string, options: BridgeOptions = {}): SlotExecutor {
  const timeoutMs = options.timeoutMs ?? 900_000
  const pollMs = options.pollMs ?? 500
  let counter = 0

  return {
    name: 'bridge',
    async propose(prompt: string, slot: AiSlotRef, current: string): Promise<string | undefined> {
      mkdirSync(dir, { recursive: true })
      const id = `${process.pid}-${++counter}`
      const requestPath = path.join(dir, `request-${id}.json`)
      writeFileSync(requestPath, JSON.stringify({ id, slot, prompt, current }, null, 2))
      const askedAt = statSync(requestPath).mtimeMs

      const responsePath = path.join(dir, `response-${id}.json`)
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        // solo vale una respuesta escrita DESPUÉS de la petición: una preescrita (o
        // sobrante de otra sesión) rellenaría un hueco que nadie ha pensado
        if (existsSync(responsePath) && statSync(responsePath).mtimeMs >= askedAt) {
          const answer = parse(responsePath)
          if (answer) {
            return answer.file ?? (answer.body !== undefined ? replaceSlotBody(current, slot.id, answer.body) : undefined)
          }
        }
        await new Promise(resolve => setTimeout(resolve, pollMs))
      }

      // sin respuesta no se propone nada: el hueco se queda vacío y el informe lo dirá
      console.log(`  (el puente no respondió en ${Math.round(timeoutMs / 1000)}s; ¿hay una sesión vigilando ${dir}?)`)
      return undefined
    }
  }
}

/** Un fichero a medio escribir no es una respuesta: se reintenta en el siguiente ciclo. */
function parse(responsePath: string): BridgeResponse | undefined {
  try {
    return JSON.parse(readFileSync(responsePath, 'utf-8')) as BridgeResponse
  } catch {
    return undefined
  }
}

/** Las peticiones que esperan respuesta ahora mismo (para que el que vigila las vea). */
export function pendingBridgeRequests(dir: string): string[] {
  if (!existsSync(dir)) return []

  return readdirSync(dir)
    .filter(name => name.startsWith('request-'))
    .filter(name => !existsSync(path.join(dir, name.replace('request-', 'response-'))))
    .map(name => path.join(dir, name))
}
