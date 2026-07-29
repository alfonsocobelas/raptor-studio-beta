import { defineResource } from './define-resource'
import { ResourceDefinition } from './resource-types'
import { SchemaValidationError } from './validation-errors'

const validDefinition = (): ResourceDefinition => ({
  schemaVersion: 1,
  name: 'contract',
  plural: 'contracts',
  context: 'sap-licensing',
  schemaName: 'sap_licensing',
  fields: {
    id: { type: 'uuid', pk: true },
    contractNumber: {
      type: 'string',
      unique: true,
      vo: 'ContractNumber',
      min: 1,
      max: 40,
      table: { show: true, label: 'Nº contrato', minWidth: 160 },
      form: { control: 'text', label: 'Nº contrato' },
      query: { sortable: true, filterable: true, searchable: true },
      column: { type: 'varchar', lengthConst: 'CONTRACT_NUMBER.MAX' }
    },
    customerId: {
      type: 'uuid',
      relation: { to: 'customer', kind: 'reference' },
      form: { control: 'none' }
    }
  }
})

const problemsOf = (definition: ResourceDefinition): string[] => {
  try {
    defineResource(definition)
    return []
  } catch (e) {
    if (e instanceof SchemaValidationError) return e.problems
    throw e
  }
}

describe('defineResource', () => {
  describe('valid definition', () => {
    it('returns the definition untouched and frozen', () => {
      const definition = validDefinition()

      const result = defineResource(definition)

      expect(result).toBe(definition)
      expect(Object.isFrozen(result)).toBe(true)
    })
  })

  describe('rule 1 — identity', () => {
    it('rejects a wrong schemaVersion', () => {
      const definition = { ...validDefinition(), schemaVersion: 2 as unknown as 1 }

      expect(problemsOf(definition)).toContain('schemaVersion: must be 1')
    })

    it.each(['name', 'plural', 'context'] as const)('rejects empty or non-kebab %s', key => {
      expect(problemsOf({ ...validDefinition(), [key]: '' })).toContain(`${key}: must be non-empty kebab-case`)
      expect(problemsOf({ ...validDefinition(), [key]: 'Bad Name' })).toContain(`${key}: must be non-empty kebab-case`)
    })

    it('rejects empty or non-snake schemaName', () => {
      expect(problemsOf({ ...validDefinition(), schemaName: '' })).toContain('schemaName: must be non-empty snake_case')
      expect(problemsOf({ ...validDefinition(), schemaName: 'bad-name' })).toContain(
        'schemaName: must be non-empty snake_case'
      )
    })
  })

  describe('rule 2 — primary key', () => {
    it('rejects a definition without pk', () => {
      const definition = validDefinition()
      delete definition.fields['id'].pk

      expect(problemsOf(definition)).toContain('fields: exactly one field must declare pk (found 0)')
    })

    it('rejects two pks', () => {
      const definition = validDefinition()
      definition.fields['customerId'].pk = true

      expect(problemsOf(definition)).toContain('fields: exactly one field must declare pk (found 2)')
    })
  })

  describe('rule 3 — table label', () => {
    it('rejects a visible column without label', () => {
      const definition = validDefinition()
      definition.fields['contractNumber'].table = { show: true }

      expect(problemsOf(definition)).toContain('fields.contractNumber: table.show requires table.label')
    })

    it('accepts a hidden column without label', () => {
      const definition = validDefinition()
      definition.fields['contractNumber'].table = { show: false }

      expect(problemsOf(definition)).toEqual([])
    })
  })

  describe('rule 4 — form label', () => {
    it('rejects a form control without label', () => {
      const definition = validDefinition()
      definition.fields['contractNumber'].form = { control: 'text' }

      expect(problemsOf(definition)).toContain("fields.contractNumber: form.control 'text' requires form.label")
    })

    it("accepts control 'none' without label (decision 4)", () => {
      expect(problemsOf(validDefinition())).toEqual([])
    })
  })

  describe('rule 5 — relation', () => {
    it('rejects an empty relation target', () => {
      const definition = validDefinition()
      definition.fields['customerId'].relation = { to: '', kind: 'reference' }

      expect(problemsOf(definition)).toContain('fields.customerId: relation.to must be non-empty')
    })

    it('rejects an unknown relation kind', () => {
      const definition = validDefinition()
      definition.fields['customerId'].relation = { to: 'customer', kind: 'magic' as never }

      expect(problemsOf(definition)).toContain("fields.customerId: relation.kind must be 'reference' or 'composition'")
    })
  })

  describe('rule 6 — column length', () => {
    it('rejects length and lengthConst together', () => {
      const definition = validDefinition()
      definition.fields['contractNumber'].column = { type: 'varchar', length: 40, lengthConst: 'X.MAX' }

      expect(problemsOf(definition)).toContain(
        'fields.contractNumber: column.length and column.lengthConst are mutually exclusive'
      )
    })
  })

  describe('rule 7 — nullableNumeric transformer', () => {
    it('rejects nullableNumeric on a non-nullable field', () => {
      const definition = validDefinition()
      definition.fields['contractNumber'].column = { type: 'numeric', transformer: 'nullableNumeric' }

      expect(problemsOf(definition)).toContain(
        'fields.contractNumber: column.transformer nullableNumeric requires nullable: true'
      )
    })
  })

  describe('rule 8 — min/max', () => {
    it('rejects min greater than max', () => {
      const definition = validDefinition()
      definition.fields['contractNumber'].min = 50

      expect(problemsOf(definition)).toContain('fields.contractNumber: min (50) must be <= max (40)')
    })
  })

  describe('accumulation', () => {
    it('reports every problem in a single error', () => {
      const definition = validDefinition()
      definition.fields['id'].pk = undefined
      definition.fields['contractNumber'].table = { show: true }
      definition.fields['contractNumber'].min = 50

      const problems = problemsOf(definition)

      expect(problems).toHaveLength(3)
    })

    it('names the resource in the error message', () => {
      const definition = { ...validDefinition(), schemaVersion: 2 as unknown as 1 }

      expect(() => defineResource(definition)).toThrow(/Invalid resource-schema 'contract'/)
    })
  })
})
