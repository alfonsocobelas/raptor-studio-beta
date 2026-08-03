import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import * as path from 'path'
import { ChatPort } from './chat.port'
import type { ChatMessage, ChatProposal, DesignPayload } from './chat.types'

/**
 * Adapter PUENTE (arnés de pruebas, STUDIO_CHAT_BRIDGE=1): escribe cada
 * petición como fichero y espera a que "alguien" (una sesión de Claude Code
 * vigilando el directorio) deposite la respuesta. Permite probar la UX del
 * chat con una inteligencia real sin clave de API. La respuesta pasa el mismo
 * gate determinista que cualquier adapter.
 */
export class BridgeChatAdapter extends ChatPort {
  readonly mode = 'bridge'
  private counter = 0

  constructor(
    private readonly dir: string,
    // 15 min: componer un diseño real (entidades, relaciones y 10 ejemplos por
    // campo) lleva minutos, y a los 3 el cliente abandonaba una respuesta válida.
    private readonly timeoutMs = 900_000,
    private readonly pollMs = 500
  ) {
    super()
  }

  async propose(messages: ChatMessage[], current: DesignPayload): Promise<ChatProposal> {
    mkdirSync(this.dir, { recursive: true })
    const id = `${process.pid}-${++this.counter}`
    const requestPath = path.join(this.dir, `request-${id}.json`)
    writeFileSync(requestPath, JSON.stringify({ id, messages, design: current }, null, 2))
    const askedAt = statSync(requestPath).mtimeMs

    const responsePath = path.join(this.dir, `response-${id}.json`)
    const deadline = Date.now() + this.timeoutMs
    while (Date.now() < deadline) {
      // Solo vale una respuesta escrita DESPUÉS de esta petición: una respuesta
      // pre-escrita (o sobrante de otra sesión) se ignora en vez de contestar
      // algo que nadie ha pensado para este mensaje.
      if (existsSync(responsePath) && statSync(responsePath).mtimeMs >= askedAt) {
        try {
          return JSON.parse(readFileSync(responsePath, 'utf-8')) as ChatProposal
        } catch {
          // fichero a medio escribir: reintentar en el siguiente ciclo
        }
      }
      await new Promise(resolve => setTimeout(resolve, this.pollMs))
    }
    throw new Error(`El puente no respondió en ${this.timeoutMs / 1000}s (¿hay una sesión vigilando ${this.dir}?)`)
  }
}
