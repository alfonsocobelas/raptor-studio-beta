import type { AppDefinition } from '@acc/schema'
import type { DraftResource } from '@app/shared/domain'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

/** El diseño completo del lienzo: nombre + entidades draft + composición. */
export interface DesignPayload {
  appName: string
  resources: DraftResource[]
  pages: AppDefinition['pages']
}

/** Lo que propone la IA: un reply breve y el diseño COMPLETO resultante (nunca código). */
export interface ChatProposal {
  reply: string
  design: DesignPayload
}
