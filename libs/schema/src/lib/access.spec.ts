import { resolveAccess } from './access'
import { ResourceDefinition } from './resource-types'

const baseDefinition = (): ResourceDefinition => ({
  schemaVersion: 1,
  name: 'invoice',
  plural: 'invoices',
  context: 'billing',
  schemaName: 'billing',
  fields: {
    id: { type: 'uuid', pk: true },
    status: {
      type: 'string',
      vo: { name: 'InvoiceStatus', fieldName: 'Status', values: ['draft', 'approved', 'rejected'] }
    }
  },
  state: {
    field: 'status',
    initial: 'draft',
    transitions: [
      { name: 'approve', label: 'Aprobar', from: ['draft'], to: 'approved' },
      { name: 'reject', label: 'Rechazar', from: ['draft'], to: 'rejected' }
    ]
  }
})

describe('resolveAccess', () => {
  it('applies the current policy when access is absent', () => {
    const resolved = resolveAccess(baseDefinition())

    expect(resolved.view).toEqual(['user', 'viewer'])
    expect(resolved.create).toEqual(['user'])
    expect(resolved.edit).toEqual(['user'])
    expect(resolved.delete).toEqual(['user'])
    expect(resolved.transitions).toEqual({ approve: ['user'], reject: ['user'] })
  })

  it('resolves no transitions when the resource has no state machine', () => {
    const definition = baseDefinition()
    delete definition.state

    expect(resolveAccess(definition).transitions).toEqual({})
  })

  it('keeps declared arrays and defaults the rest', () => {
    const definition = { ...baseDefinition(), access: { view: ['user' as const] } }

    const resolved = resolveAccess(definition)

    expect(resolved.view).toEqual(['user'])
    expect(resolved.create).toEqual(['user'])
    expect(resolved.edit).toEqual(['user'])
    expect(resolved.delete).toEqual(['user'])
  })

  it('resolves each granular capability independently', () => {
    const definition = {
      ...baseDefinition(),
      access: { create: ['user' as const], edit: ['user' as const, 'viewer' as const], delete: [] }
    }

    const resolved = resolveAccess(definition)

    expect(resolved.create).toEqual(['user'])
    expect(resolved.edit).toEqual(['user', 'viewer'])
    expect(resolved.delete).toEqual([])
  })

  it('expands legacy manage as the fallback for create, edit and delete', () => {
    const definition = { ...baseDefinition(), access: { manage: ['user' as const, 'viewer' as const] } }

    const resolved = resolveAccess(definition)

    expect(resolved.create).toEqual(['user', 'viewer'])
    expect(resolved.edit).toEqual(['user', 'viewer'])
    expect(resolved.delete).toEqual(['user', 'viewer'])
  })

  it('lets a granular capability win over legacy manage', () => {
    const definition = {
      ...baseDefinition(),
      access: { manage: ['user' as const, 'viewer' as const], delete: [] }
    }

    const resolved = resolveAccess(definition)

    expect(resolved.create).toEqual(['user', 'viewer'])
    expect(resolved.edit).toEqual(['user', 'viewer'])
    expect(resolved.delete).toEqual([])
  })

  it('respects an empty array as an admin-only decision', () => {
    const definition = { ...baseDefinition(), access: { manage: [] } }

    const resolved = resolveAccess(definition)

    expect(resolved.create).toEqual([])
    expect(resolved.edit).toEqual([])
    expect(resolved.delete).toEqual([])
  })

  it('defaults the transitions not named in access.transitions', () => {
    const definition = { ...baseDefinition(), access: { transitions: { approve: ['viewer' as const] } } }

    expect(resolveAccess(definition).transitions).toEqual({ approve: ['viewer'], reject: ['user'] })
  })
})
