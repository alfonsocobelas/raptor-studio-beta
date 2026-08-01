const createMock = jest.fn()
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({ messages: { create: createMock } }))
})

import { AnthropicChatAdapter } from '@app/backend/contexts/studio/chat/anthropic-chat.adapter'
import type { DesignPayload } from '@app/backend/contexts/studio/chat/chat.types'

const design: DesignPayload = {
  appName: 'flotas',
  resources: [
    {
      name: 'vehiculo',
      plural: 'vehiculos',
      labelSingular: 'Vehículo',
      labelPlural: 'Vehículos',
      gender: 'm',
      fields: [{ name: 'matricula', label: 'Matrícula', type: 'string' }]
    }
  ],
  pages: [{ title: 'Vehículos', blocks: [{ kind: 'table', resource: 'vehiculo' }] }]
}

describe('AnthropicChatAdapter', () => {
  beforeEach(() => createMock.mockReset())

  it('llama a claude-opus-5 con structured outputs y devuelve el diseño parseado', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'Hecho', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    const proposal = await adapter.propose([{ role: 'user', text: 'añade vehículos' }], design)

    expect(proposal.design.resources[0].name).toBe('vehiculo')
    const params = createMock.mock.calls[0][0]
    expect(params.model).toBe('claude-opus-5')
    expect(params.output_config.format.type).toBe('json_schema')
    // el schema de salida tipa los campos de entidad (la IA crea entidades nuevas)
    expect(JSON.stringify(params.output_config.format.schema)).toContain('"integer"')
    // el diseño vigente viaja en el último turno de usuario
    expect(params.messages.at(-1).content).toContain('"flotas"')
    expect(params).not.toHaveProperty('temperature')
  })

  it('maneja el refusal como error controlado', async () => {
    createMock.mockResolvedValue({ stop_reason: 'refusal', stop_details: { category: null }, content: [] })
    const adapter = new AnthropicChatAdapter()

    await expect(adapter.propose([{ role: 'user', text: 'x' }], design)).rejects.toThrow(/rechazad/i)
  })
})
