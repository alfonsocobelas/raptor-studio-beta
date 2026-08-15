import type { BusinessBrief, BusinessFlow, PortsDefinition } from '@raptor/schema'
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
  /** Paleta elegida en el lienzo (id del catálogo de @raptor/schema) */
  palette?: string
  /** Puertos elegidos para ejecutar la app en local (hallazgo 14) */
  ports?: PortsDefinition
  /** Contexto de negocio destilado del chat; el usuario lo ve y lo corrige (spec 22) */
  brief?: BusinessBrief
  /** Procesos de negocio dibujados o propuestos (spec 28); nunca generan código */
  flows?: BusinessFlow[]
}

/** Lo que propone la IA: un reply breve y el diseño COMPLETO resultante (nunca código). */
export interface ChatProposal {
  reply: string
  design: DesignPayload
}
