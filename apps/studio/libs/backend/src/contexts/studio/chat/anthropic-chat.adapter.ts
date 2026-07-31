import Anthropic from '@anthropic-ai/sdk'
import type { AppDefinition, ResourceDefinition } from '@acc/schema'
import { ChatPort } from './chat.port'
import type { ChatMessage, ChatProposal } from './chat.types'

/**
 * Adapter real: claude-opus-5 con structured outputs — la respuesta llega YA
 * conforme al JSON Schema del app-schema (doble cinturón: el gate del
 * controller vuelve a validar). La clave la resuelve el SDK del entorno.
 */
export class AnthropicChatAdapter extends ChatPort {
  readonly mode = 'anthropic'
  private readonly client = new Anthropic()
  private readonly system: string
  private readonly responseSchema: Record<string, unknown>

  constructor(registry: Record<string, ResourceDefinition>) {
    super()
    this.system = buildSystemPrompt(registry)
    this.responseSchema = buildResponseSchema(Object.keys(registry))
  }

  async propose(messages: ChatMessage[], currentSchema: AppDefinition): Promise<ChatProposal> {
    const turns = messages.map((m, i) => ({
      role: m.role,
      content:
        // el schema vigente viaja en el último turno de usuario: la IA parte SIEMPRE del estado real
        i === messages.length - 1 && m.role === 'user'
          ? `App-schema vigente:\n${JSON.stringify(currentSchema, null, 2)}\n\nPetición: ${m.text}`
          : m.text
    }))

    const response = await this.client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: this.system,
      messages: turns,
      output_config: { format: { type: 'json_schema', schema: this.responseSchema } }
    })

    if (response.stop_reason === 'refusal') {
      throw new Error('La petición fue rechazada por los clasificadores de seguridad del modelo.')
    }
    const text = response.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined
    if (!text) {
      throw new Error(`Respuesta sin contenido (stop_reason: ${response.stop_reason})`)
    }
    return JSON.parse(text.text) as ChatProposal
  }
}

function buildSystemPrompt(registry: Record<string, ResourceDefinition>): string {
  const catalog = Object.values(registry)
    .map(m => `- ${m.name} («${m.labels?.plural ?? m.plural}»): ${m.labels?.subtitle ?? ''}`)
    .join('\n')
  return [
    'Eres el asistente de diseño de un acelerador de dashboards. El usuario describe la aplicación',
    'que quiere y tú respondes con el app-schema COMPLETO resultante (nunca código).',
    '',
    'Vocabulario del app-schema: páginas de tipo "dashboard" (con widgets "kpi-total") y "resource".',
    'El orden de páginas gobierna el menú y las rutas. Como máximo un dashboard.',
    '',
    'Catálogo de recursos disponibles (los ÚNICOS que puedes usar):',
    catalog,
    '',
    'Reglas: parte siempre del app-schema vigente que acompaña a la petición; aplica el cambio',
    'mínimo que pide el usuario; nunca inventes recursos fuera del catálogo; el campo reply es',
    'una frase breve en español explicando qué cambiaste (o por qué no procede el cambio).'
  ].join('\n')
}

/** JSON Schema de {reply, schema} con el enum de recursos acotado al catálogo real. */
function buildResponseSchema(resources: string[]): Record<string, unknown> {
  const resourceEnum = { type: 'string', enum: resources }
  return {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      schema: {
        type: 'object',
        properties: {
          schemaVersion: { type: 'integer', const: 1 },
          name: { type: 'string' },
          pages: {
            type: 'array',
            items: {
              anyOf: [
                {
                  type: 'object',
                  properties: {
                    kind: { type: 'string', const: 'dashboard' },
                    label: { type: 'string' },
                    widgets: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: { kind: { type: 'string', const: 'kpi-total' }, resource: resourceEnum },
                        required: ['kind', 'resource'],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ['kind', 'widgets'],
                  additionalProperties: false
                },
                {
                  type: 'object',
                  properties: {
                    kind: { type: 'string', const: 'resource' },
                    resource: resourceEnum,
                    label: { type: 'string' }
                  },
                  required: ['kind', 'resource'],
                  additionalProperties: false
                }
              ]
            }
          }
        },
        required: ['schemaVersion', 'name', 'pages'],
        additionalProperties: false
      }
    },
    required: ['reply', 'schema'],
    additionalProperties: false
  }
}
