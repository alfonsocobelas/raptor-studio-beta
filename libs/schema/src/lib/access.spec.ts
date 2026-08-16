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
    expect(resolved.manage).toEqual(['user'])
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
    expect(resolved.manage).toEqual(['user'])
  })

  it('respects an empty array as an admin-only decision', () => {
    const definition = { ...baseDefinition(), access: { manage: [] } }

    expect(resolveAccess(definition).manage).toEqual([])
  })

  it('defaults the transitions not named in access.transitions', () => {
    const definition = { ...baseDefinition(), access: { transitions: { approve: ['viewer' as const] } } }

    expect(resolveAccess(definition).transitions).toEqual({ approve: ['viewer'], reject: ['user'] })
  })
})
