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
  '  plural, labelSingular/labelPlural en español, gender (m|f), fields tipados y',
  '  attachments (boolean): true si la vista de la entidad incluye subida de ficheros.',
  '  Tipos de campo: string (texto corto), text (texto largo), number (decimal), integer,',
  '  boolean, date. El primer campo string actúa como «nombre» de la entidad.',
  '- pages: las VISTAS. Cada una con title y blocks (bloques en orden, ancho "full" o "half"):',
  '    {kind:"table", resource}       listado con búsqueda, filtros y CRUD',
  '    {kind:"kpis", resources:[...]} fila de tarjetas de totales',
  '    {kind:"fields", resource}      ficha con los datos de un registro',
  '    {kind:"cards", resource}       galería de tarjetas',
  '    {kind:"attachments", resource} subida de ficheros',
  '  Una vista puede combinar varios bloques (p. ej. kpis + table, o fields + attachments).',
  '  El orden de vistas gobierna el menú; todo bloque referencia entidades de resources.',
  '',
  'Cada campo lleva samples: 10 valores de ejemplo REALISTAS y coherentes con el negocio',
  '(nombres de producto reales, precios con céntimos, ciudades, referencias tipo XXX-1041,',
  'fechas dd/mm/aaaa, booleanos como Sí/No) — son el mockup que ve el usuario.',
  '',
  'RELACIONES: declara las que se deducen de la petición, no las omitas. Si una cita es',
  'de un paciente, cita lleva {name:"paciente", label:"Paciente", type:"ref", refTo:"paciente"}',
  'y sus samples son nombres del padre (los mismos que declaraste en esa entidad). refTo',
  'debe nombrar una entidad de resources, nunca la propia. Sin relaciones la app son tablas',
  'sueltas: un pedido SIN cliente o una cita SIN paciente están mal diseñados.',
  '',
  'Reglas: parte SIEMPRE del diseño vigente adjunto a la petición; aplica el cambio mínimo',
  'pedido; conserva lo que el usuario no ha pedido cambiar; nombres de campo en camelCase;',
  'reply es una frase breve en español explicando qué cambiaste.'
].join('\n')

const FIELD_TYPES = ['string', 'text', 'number', 'integer', 'boolean', 'date', 'ref']

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
              attachments: { type: 'boolean' },
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    label: { type: 'string' },
                    type: { type: 'string', enum: FIELD_TYPES },
                    samples: { type: 'array', items: { type: 'string' } },
                    refTo: { type: 'string' }
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
            type: 'object',
            properties: {
              title: { type: 'string' },
              blocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    kind: { type: 'string', enum: ['table', 'kpis', 'fields', 'cards', 'attachments', 'text'] },
                    resource: { type: 'string' },
                    resources: { type: 'array', items: { type: 'string' } },
                    text: { type: 'string' },
                    width: { type: 'string', enum: ['full', 'half'] }
                  },
                  required: ['kind'],
                  additionalProperties: false
                }
              }
            },
            required: ['title', 'blocks'],
            additionalProperties: false
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
