import type { PortsDefinition } from '@acc/schema'
import type { DesignPage, DraftResource } from '@app/shared/domain'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

/** El diseño completo del lienzo: nombre + entidades draft + composición. */
export interface DesignPayload {
  appName: string
  resources: DraftResource[]
  pages: DesignPage[]
  /** Paleta elegida en el lienzo (id del catálogo de @acc/schema) */
  palette?: string
  /** Puertos elegidos para ejecutar la app en local (hallazgo 14) */
  ports?: PortsDefinition
}

/** Lo que propone la IA: un reply breve y el diseño COMPLETO resultante (nunca código). */
export interface ChatProposal {
  reply: string
  design: DesignPayload
}
