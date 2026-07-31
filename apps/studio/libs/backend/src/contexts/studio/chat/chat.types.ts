import type { AppDefinition } from '@acc/schema'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

/** Lo que propone la IA: un reply breve y el app-schema COMPLETO resultante (nunca código). */
export interface ChatProposal {
  reply: string
  schema: AppDefinition
}
