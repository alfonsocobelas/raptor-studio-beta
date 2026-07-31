import type { AppDefinition } from '@acc/schema'
import { validateProposal } from '@app/backend/contexts/studio/chat/validate-proposal'

describe('validateProposal — gate determinista del chat', () => {
  it('acepta un app-schema válido contra el catálogo real', () => {
    const schema: AppDefinition = {
      schemaVersion: 1,
      name: 'boutique',
      pages: [{ kind: 'resource', resource: 'garment' }]
    }

    expect(() => validateProposal(schema)).not.toThrow()
  })

  it('rechaza un recurso fuera del catálogo', () => {
    const schema: AppDefinition = {
      schemaVersion: 1,
      name: 'boutique',
      pages: [{ kind: 'resource', resource: 'unicornio' }]
    }

    expect(() => validateProposal(schema)).toThrow(/unknown resource model 'unicornio'/)
  })

  it('rechaza un schema estructuralmente inválido', () => {
    const schema = { schemaVersion: 1, name: 'x', pages: [] } as unknown as AppDefinition

    expect(() => validateProposal(schema)).toThrow(/at least one page/)
  })
})
