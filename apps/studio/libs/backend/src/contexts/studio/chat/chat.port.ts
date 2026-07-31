import type { AppDefinition } from '@acc/schema'
import type { ChatMessage, ChatProposal } from './chat.types'

/**
 * Puerto del chat de diseño: recibe la conversación y el app-schema vigente y
 * devuelve una propuesta. La propuesta NUNCA se aplica sin pasar el gate
 * determinista (validate-proposal) — se confía en el gate, no en la IA.
 */
export abstract class ChatPort {
  abstract propose(messages: ChatMessage[], currentSchema: AppDefinition): Promise<ChatProposal>
  /** 'anthropic' | 'fake' — la UI lo muestra para dejar claro el modo demo. */
  abstract readonly mode: string
}
