import { buildSubstitutions } from './build-substitutions'
import { contract } from './models/contract.model'
import { ResourceDefinition } from '@acc/schema'

describe('buildSubstitutions', () => {
  describe('name variants', () => {
    it('derives all capitalizations from the model name', () => {
      // WHEN
      const subs = buildSubstitutions(contract)

      // THEN
      expect(subs.className).toBe('Contract')
      expect(subs.propertyName).toBe('contract')
      expect(subs.fileName).toBe('contract')
      expect(subs.plural).toBe('contracts')
      expect(subs.schemaName).toBe('sap_licensing')
    })
  })

  describe('module-level flags', () => {
    it('detects Nullable usage, transformers, constraints and audit columns for contract', () => {
      // WHEN
      const subs = buildSubstitutions(contract)

      // THEN
      expect(subs.needsNullable).toBe(true)
      expect(subs.needsNumericTransformer).toBe(true)
      expect(subs.needsNullableNumericTransformer).toBe(true)
      expect(subs.constraintsConst).toBe('CONTRACT_CONSTRAINTS')
      expect(subs.audit).toBe(true)
    })

    it('computes the typeorm import list sorted alphabetically', () => {
      const subs = buildSubstitutions(contract)

      expect(subs.typeormImports).toBe('Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn')
    })

    it('imports only what a minimal model uses', () => {
      const minimal: ResourceDefinition = {
        schemaVersion: 1,
        name: 'thing',
        plural: 'things',
        context: 'demo',
        schemaName: 'demo',
        fields: { id: { type: 'uuid', pk: true } }
      }

      expect(buildSubstitutions(minimal).typeormImports).toBe('Entity, PrimaryColumn')
    })

    it('reports no flags for a minimal model', () => {
      // GIVEN
      const minimal: ResourceDefinition = {
        schemaVersion: 1,
        name: 'thing',
        plural: 'things',
        context: 'demo',
        schemaName: 'demo',
        fields: { id: { type: 'uuid', pk: true } }
      }

      // WHEN
      const subs = buildSubstitutions(minimal)

      // THEN
      expect(subs.needsNullable).toBe(false)
      expect(subs.needsNumericTransformer).toBe(false)
      expect(subs.needsNullableNumericTransformer).toBe(false)
      expect(subs.constraintsConst).toBeUndefined()
      expect(subs.audit).toBe(false)
    })
  })

  describe('per-field rendering (pre-chewed for dumb templates)', () => {
    it('renders a primary column without options', () => {
      const subs = buildSubstitutions(contract)
      const id = subs.columns.find(c => c.name === 'id')

      expect(id).toEqual({ name: 'id', tsType: 'string', decorator: 'PrimaryColumn', argsSrc: "'uuid'", comment: [] })
    })

    it('renders literal length options', () => {
      const subs = buildSubstitutions(contract)
      const contractType = subs.columns.find(c => c.name === 'contractType')

      expect(contractType?.decorator).toBe('Column')
      expect(contractType?.argsSrc).toBe("'varchar', { length: 20 }")
    })

    it('renders constraint-based lengths against the LIMITS alias', () => {
      const subs = buildSubstitutions(contract)
      const contractNumber = subs.columns.find(c => c.name === 'contractNumber')

      expect(contractNumber?.argsSrc).toBe("'varchar', { length: LIMITS.CONTRACT_NUMBER.MAX, nullable: true }")
      expect(contractNumber?.tsType).toBe('Nullable<string>')
      expect(contractNumber?.comment).toHaveLength(2)
    })

    it('renders string, number and boolean defaults with correct literals', () => {
      const subs = buildSubstitutions(contract)

      expect(subs.columns.find(c => c.name === 'status')?.argsSrc).toBe("'varchar', { length: 20, default: 'active' }")
      expect(subs.columns.find(c => c.name === 'nbrOfContracts')?.argsSrc).toBe("'int', { default: 1 }")
      expect(subs.columns.find(c => c.name === 'isFavorite')?.argsSrc).toBe("'boolean', { default: false }")
    })

    it('renders raw defaults as arrow functions (array column)', () => {
      const subs = buildSubstitutions(contract)
      const areas = subs.columns.find(c => c.name === 'subSolutionAreas')

      expect(areas?.argsSrc).toBe("'text', { array: true, default: () => \"'{}'\" }")
    })

    it('renders numeric transformers by name', () => {
      const subs = buildSubstitutions(contract)

      expect(subs.columns.find(c => c.name === 'totalValue')?.argsSrc).toBe(
        "'numeric', { precision: 15, scale: 2, default: 0, transformer: numericTransformer }"
      )
      expect(subs.columns.find(c => c.name === 'upcomingMaintenanceFee')?.argsSrc).toBe(
        "'numeric', { precision: 15, scale: 2, nullable: true, transformer: nullableNumericTransformer }"
      )
    })

    it('renders plain nullable timestamptz columns', () => {
      const subs = buildSubstitutions(contract)

      expect(subs.columns.find(c => c.name === 'archivedAt')?.argsSrc).toBe("'timestamptz', { nullable: true }")
    })

    it('keeps model field order (the diff against the golden reference depends on it)', () => {
      const subs = buildSubstitutions(contract)

      expect(subs.columns.map(c => c.name)).toEqual(Object.keys(contract.fields))
    })
  })
})

describe('buildSubstitutions — spec 03 derivations', () => {
  const subs = buildSubstitutions(contract)

  describe('ordered query lists', () => {
    it('orders ALLOWED_FILTERS by the numeric flag, not by field order', () => {
      expect(subs.allowedFilters).toEqual([
        'id',
        'contractType',
        'status',
        'source',
        'customerId',
        'customerName',
        'contractNumber'
      ])
    })

    it('orders ALLOWED_ORDERS by the numeric flag', () => {
      expect(subs.allowedOrders).toEqual([
        'contractNumber',
        'customerName',
        'startDate',
        'endDate',
        'totalValue',
        'status'
      ])
    })

    it('orders SEARCHABLE_FIELDS and carries the search notes', () => {
      expect(subs.searchableFields).toEqual(['contractNumber', 'customerName', 'cmsCaseId'])
      expect(subs.searchNotes).toHaveLength(2)
    })
  })

  describe('constants entries', () => {
    it('renders shared refs and literal groups preserving declaration order', () => {
      expect(subs.constraintEntries.slice(0, 3)).toEqual([
        'CONTRACT_NUMBER: SHARED_CONSTRAINTS.CONTRACT_NUMBER',
        'CUSTOMER_NAME: SHARED_CONSTRAINTS.CUSTOMER_NAME',
        'CMS_CASE_ID: { MAX: 30 }'
      ])
      expect(subs.constraintEntries).toContain('CURRENCY: { LENGTH: 3 }')
      expect(subs.hasSharedConstraints).toBe(true)
    })
  })

  describe('mapper lines', () => {
    it('emits plain toDomain lines for regular fields', () => {
      expect(subs.toDomainProps).toContain('contractNumber: entity.contractNumber')
    })

    it('converts Nullable<Date> columns to ISO strings in toDomain', () => {
      expect(subs.toDomainProps).toContain('archivedAt: entity.archivedAt?.toISOString() ?? null')
    })

    it('converts Nullable<Date> back with a ternary in toPersistence', () => {
      expect(subs.toPersistenceLines).toContain(
        'entity.archivedAt = primitives.archivedAt ? new Date(primitives.archivedAt) : null'
      )
    })

    it('falls back to the column default (or null) for optional primitives', () => {
      expect(subs.toPersistenceLines).toContain("entity.origin = primitives.origin ?? 'MANUAL'")
      expect(subs.toPersistenceLines).toContain("entity.supportModel = primitives.supportModel ?? ''")
      expect(subs.toPersistenceLines).toContain(
        'entity.upcomingMaintenanceFee = primitives.upcomingMaintenanceFee ?? null'
      )
    })

    it('keeps audit columns out of the mapper', () => {
      expect(subs.toDomainProps.join()).not.toContain('createdAt')
    })
  })
})
