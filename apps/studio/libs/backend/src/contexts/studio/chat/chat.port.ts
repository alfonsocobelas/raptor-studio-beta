import type { ChatMessage, ChatProposal, DesignPayload } from './chat.types'

/**
 * Puerto del chat de diseño: recibe la conversación y el diseño vigente
 * (entidades draft + páginas) y devuelve una propuesta completa. La propuesta
 * NUNCA se aplica sin pasar el gate determinista — se confía en el gate, no en la IA.
 */
export abstract class ChatPort {
  abstract propose(messages: ChatMessage[], current: DesignPayload): Promise<ChatProposal>
  /** 'anthropic' | 'fake' — la UI lo muestra para dejar claro el modo demo. */
  abstract readonly mode: string
}
