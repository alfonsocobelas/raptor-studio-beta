import type { AppDefinition, ResourceDefinition } from '@acc/schema'

const createMock = jest.fn()
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({ messages: { create: createMock } }))
})

import { AnthropicChatAdapter } from '@app/backend/contexts/studio/chat/anthropic-chat.adapter'

const registry = {
  garment: { name: 'garment', plural: 'garments', labels: { plural: 'Prendas' } } as unknown as ResourceDefinition
}

const schema: AppDefinition = {
  schemaVersion: 1,
  name: 'boutique',
  pages: [{ kind: 'resource', resource: 'garment' }]
}

describe('AnthropicChatAdapter', () => {
  beforeEach(() => createMock.mockReset())

  it('llama a claude-opus-5 con structured outputs y devuelve la propuesta parseada', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'Hecho', schema }) }]
    })
    const adapter = new AnthropicChatAdapter(registry)

    const proposal = await adapter.propose([{ role: 'user', text: 'añade prendas' }], schema)

    expect(proposal.reply).toBe('Hecho')
    expect(proposal.schema).toEqual(schema)
    const params = createMock.mock.calls[0][0]
    expect(params.model).toBe('claude-opus-5')
    expect(params.output_config.format.type).toBe('json_schema')
    // el catálogo real acota el enum de recursos en el schema de salida
    expect(JSON.stringify(params.output_config.format.schema)).toContain('"garment"')
    // el system prompt describe el catálogo, nunca inventado a mano
    expect(params.system).toContain('Prendas')
    // sin sampling params (Opus 5 los rechaza)
    expect(params).not.toHaveProperty('temperature')
  })

  it('convierte la conversación al formato de la Messages API', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', schema }) }]
    })
    const adapter = new AnthropicChatAdapter(registry)

    await adapter.propose(
      [
        { role: 'user', text: 'hola' },
        { role: 'assistant', text: 'dime' },
        { role: 'user', text: 'añade prendas' }
      ],
      schema
    )

    const params = createMock.mock.calls[0][0]
    expect(params.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant', 'user'])
    // el schema vigente viaja en el último turno de usuario
    expect(params.messages.at(-1).content).toContain('"boutique"')
  })

  it('maneja el refusal de los clasificadores como error controlado', async () => {
    createMock.mockResolvedValue({ stop_reason: 'refusal', stop_details: { category: null }, content: [] })
    const adapter = new AnthropicChatAdapter(registry)

    await expect(adapter.propose([{ role: 'user', text: 'x' }], schema)).rejects.toThrow(/rechazad/i)
  })
})
