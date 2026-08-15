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

  it('el schema de salida admite referencias entre entidades (spec 15)', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    await adapter.propose([{ role: 'user', text: 'x' }], design)
    const schema = JSON.stringify(createMock.mock.calls[0][0].output_config.format.schema)

    expect(schema).toContain('"ref"')
    expect(schema).toContain('refTo')
  })

  it('el prompt pide declarar las relaciones que se deducen de la petición', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    await adapter.propose([{ role: 'user', text: 'x' }], design)
    const system = createMock.mock.calls[0][0].system as string

    expect(system).toMatch(/relaci/i)
    expect(system).toContain('refTo')
  })

  it('el esquema de salida admite enums con sus valores', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    await adapter.propose([{ role: 'user', text: 'x' }], design)
    const schema = JSON.stringify(createMock.mock.calls[0][0].output_config.format.schema)

    expect(schema).toContain('enum')
    expect(schema).toContain('values')
  })

  it('el prompt pide declarar enums cuando el dominio tiene estados', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    await adapter.propose([{ role: 'user', text: 'x' }], design)
    const system = createMock.mock.calls[0][0].system as string

    expect(system).toMatch(/enum/i)
    expect(system).toMatch(/estado|prioridad/i)
  })

  /**
   * Spec 43: la máquina de estados. El chat es quien la propone desde el texto del
   * usuario («una muestra se recoge, se analiza y se certifica o se rechaza»): el
   * schema de salida debe admitirla y el prompt debe enseñar a declararla.
   */
  it('el esquema de salida admite la máquina de estados del recurso', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    await adapter.propose([{ role: 'user', text: 'x' }], design)
    const schema = JSON.stringify(createMock.mock.calls[0][0].output_config.format.schema)

    expect(schema).toContain('"state"')
    expect(schema).toContain('transitions')
    expect(schema).toContain('initial')
  })

  it('el prompt enseña a promover el enum a estado con sus transiciones', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    await adapter.propose([{ role: 'user', text: 'x' }], design)
    const system = createMock.mock.calls[0][0].system as string

    expect(system).toMatch(/MÁQUINA DE ESTADOS/i)
    expect(system).toContain('transitions')
    expect(system).toContain('initial')
    expect(system).toMatch(/ciclo de vida/i)
  })

  /**
   * Spec 44: la convergencia. El chat declara `transition` en los pasos de flujo que
   * ejecutan un verbo de la máquina de su entidad — y NO la inventa en los demás.
   */
  it('el esquema de salida admite transition en los nodos de flujo', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    await adapter.propose([{ role: 'user', text: 'x' }], design)
    const nodesSchema = JSON.stringify(
      (createMock.mock.calls[0][0].output_config.format.schema as { properties: { design: { properties: { flows: { items: { properties: { nodes: unknown } } } } } } })
        .properties.design.properties.flows.items.properties.nodes
    )

    expect(nodesSchema).toContain('"transition"')
  })

  it('el prompt enseña cuándo un paso declara transition y cuándo no', async () => {
    createMock.mockResolvedValue({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ reply: 'ok', design }) }]
    })
    const adapter = new AnthropicChatAdapter()

    await adapter.propose([{ role: 'user', text: 'x' }], design)
    const system = createMock.mock.calls[0][0].system as string

    expect(system).toMatch(/transition/)
    expect(system).toMatch(/endpoint|cuerpo real/i)
  })
})
