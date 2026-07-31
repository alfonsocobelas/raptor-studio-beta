import type { AppDefinition, ResourceDefinition } from '@acc/schema'
import { FakeChatAdapter } from '@app/backend/contexts/studio/chat/fake-chat.adapter'

const registry = Object.fromEntries(
  [
    ['garment', 'garments', 'Prendas'],
    ['supplier', 'suppliers', 'Proveedores'],
    ['movement', 'movements', 'Movimientos']
  ].map(([name, plural, label]) => [
    name,
    { name, plural, labels: { plural: label } } as unknown as ResourceDefinition
  ])
) as Record<string, ResourceDefinition>

const schema = (): AppDefinition => ({
  schemaVersion: 1,
  name: 'boutique',
  pages: [
    { kind: 'dashboard', widgets: [{ kind: 'kpi-total', resource: 'garment' }] },
    { kind: 'resource', resource: 'garment' }
  ]
})

describe('FakeChatAdapter — modo demo determinista', () => {
  const adapter = new FakeChatAdapter(registry)

  it('añade una página de un recurso del catálogo por label', async () => {
    const proposal = await adapter.propose([{ role: 'user', text: 'Añade la página de Proveedores' }], schema())

    expect(proposal.schema.pages).toContainEqual({ kind: 'resource', resource: 'supplier' })
    expect(proposal.reply.toLowerCase()).toContain('proveedores')
  })

  it('quita una página existente', async () => {
    const proposal = await adapter.propose([{ role: 'user', text: 'quita la página de prendas' }], schema())

    expect(proposal.schema.pages.some(p => p.kind === 'resource' && p.resource === 'garment')).toBe(false)
  })

  it('añade un KPI al dashboard', async () => {
    const proposal = await adapter.propose([{ role: 'user', text: 'añade el kpi de movimientos' }], schema())

    const dashboard = proposal.schema.pages[0]
    expect(dashboard.kind).toBe('dashboard')
    if (dashboard.kind === 'dashboard') {
      expect(dashboard.widgets).toContainEqual({ kind: 'kpi-total', resource: 'movement' })
    }
  })

  it('si no entiende, devuelve el schema intacto con una explicación', async () => {
    const original = schema()
    const proposal = await adapter.propose([{ role: 'user', text: 'hazme un sandwich' }], original)

    expect(proposal.schema).toEqual(original)
    expect(proposal.reply.length).toBeGreaterThan(0)
  })

  it('solo usa el último mensaje del usuario', async () => {
    const proposal = await adapter.propose(
      [
        { role: 'user', text: 'añade la página de proveedores' },
        { role: 'assistant', text: 'hecho' },
        { role: 'user', text: 'quita la página de prendas' }
      ],
      schema()
    )

    expect(proposal.schema.pages.some(p => p.kind === 'resource' && p.resource === 'garment')).toBe(false)
    expect(proposal.schema.pages.some(p => p.kind === 'resource' && p.resource === 'supplier')).toBe(false)
  })
})
