import Anthropic from '@anthropic-ai/sdk'
import { ChatPort } from './chat.port'
import type { ChatMessage, ChatProposal, DesignPayload } from './chat.types'

/**
 * Adapter real: claude-opus-5 con structured outputs — la IA diseña ENTIDADES
 * NUEVAS (drafts con campos tipados) y la composición de páginas; nunca código.
 * El gate del controller re-valida todo (doble cinturón).
 */
export class AnthropicChatAdapter extends ChatPort {
  readonly mode = 'anthropic'
  private readonly client = new Anthropic()

  async propose(messages: ChatMessage[], current: DesignPayload): Promise<ChatProposal> {
    const turns = messages.map((m, i) => ({
      role: m.role,
      content:
        i === messages.length - 1 && m.role === 'user'
          ? `Diseño vigente:\n${JSON.stringify(current, null, 2)}\n\nPetición: ${m.text}`
          : m.text
    }))

    const response = await this.client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: turns,
      output_config: { format: { type: 'json_schema', schema: RESPONSE_SCHEMA } }
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

const SYSTEM_PROMPT = [
  'Eres el asistente de diseño de un acelerador de dashboards. El usuario describe la aplicación',
  'que quiere y tú respondes con el DISEÑO completo resultante (nunca código):',
  '',
  '- appName: nombre kebab-case de la aplicación.',
  '- resources: las ENTIDADES del negocio (tú las creas). Cada una con name (singular kebab),',
  '  plural, labelSingular/labelPlural en español, gender (m|f) y fields tipados.',
  '  Tipos de campo: string (texto corto), text (texto largo), number (decimal), integer,',
  '  boolean, date. El primer campo string actúa como «nombre» de la entidad.',
  '- pages: composición. Páginas {kind:"resource", resource:<name>} (tabla+CRUD de la entidad)',
  '  y como máximo un {kind:"dashboard", widgets:[{kind:"kpi-total", resource}]}.',
  '  El orden gobierna el menú; toda página/widget referencia entidades de resources.',
  '',
  'Cada campo lleva samples: 10 valores de ejemplo REALISTAS y coherentes con el negocio',
  '(nombres de producto reales, precios con céntimos, ciudades, referencias tipo XXX-1041,',
  'fechas dd/mm/aaaa, booleanos como Sí/No) — son el mockup que ve el usuario.',
  '',
  'Reglas: parte SIEMPRE del diseño vigente adjunto a la petición; aplica el cambio mínimo',
  'pedido; conserva lo que el usuario no ha pedido cambiar; nombres de campo en camelCase;',
  'reply es una frase breve en español explicando qué cambiaste.'
].join('\n')

const FIELD_TYPES = ['string', 'text', 'number', 'integer', 'boolean', 'date']

const RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    design: {
      type: 'object',
      properties: {
        appName: { type: 'string' },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              plural: { type: 'string' },
              labelSingular: { type: 'string' },
              labelPlural: { type: 'string' },
              gender: { type: 'string', enum: ['m', 'f'] },
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    label: { type: 'string' },
                    type: { type: 'string', enum: FIELD_TYPES },
                    samples: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['name', 'label', 'type', 'samples'],
                  additionalProperties: false
                }
              }
            },
            required: ['name', 'plural', 'labelSingular', 'labelPlural', 'gender', 'fields'],
            additionalProperties: false
          }
        },
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
                      properties: { kind: { type: 'string', const: 'kpi-total' }, resource: { type: 'string' } },
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
                  resource: { type: 'string' },
                  label: { type: 'string' }
                },
                required: ['kind', 'resource'],
                additionalProperties: false
              }
            ]
          }
        }
      },
      required: ['appName', 'resources', 'pages'],
      additionalProperties: false
    }
  },
  required: ['reply', 'design'],
  additionalProperties: false
}
