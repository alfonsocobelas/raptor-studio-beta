import { renderMongo } from './build-mongo'
import { customer } from './models/customer.model'
import { contract } from './models/contract.model'
import { license } from './models/license.model'

describe('renderMongo', () => {
  describe('doc fields', () => {
    it('maps field types to mongoose types and skips the pk (lives in _id)', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN
      expect(mongo.docFields.find(f => f.name === 'id')).toBeUndefined()
      const name = mongo.docFields.find(f => f.name === 'name')
      expect(name?.defSrc).toBe('{ type: String, required: true }')
      expect(name?.tsType).toBe('string')
    })

    it('gives nullable fields a null default and optional-unique strings their empty-string default', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — taxId es el unique ifPresent del canon: default '' como su columna varchar
      const taxId = mongo.docFields.find(f => f.name === 'taxId')
      expect(taxId?.defSrc).toBe("{ type: String, default: '' }")

      const notes = mongo.docFields.find(f => f.name === 'notes')
      expect(notes?.defSrc).toBe('{ type: String, default: null }')
      expect(notes?.tsType).toBe('Nullable<string>')
    })

    it('maps timestamptz to Date and numeric flags to Number without transformers', () => {
      // WHEN
      const mongo = renderMongo(contract)

      // THEN
      const totalValue = mongo.docFields.find(f => f.name === 'totalValue')
      expect(totalValue?.defSrc).toContain('type: Number')
      expect(totalValue?.defSrc).not.toContain('transformer')
    })
  })

  describe('unique indexes', () => {
    it('renders a plain unique index for required uniques and a partial one for ifPresent uniques', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN
      expect(mongo.indexLines).toContain("CustomerSchema.index({ sapId: 1 }, { unique: true })")
      expect(mongo.indexLines).toContain(
        "CustomerSchema.index({ taxId: 1 }, { unique: true, partialFilterExpression: { taxId: { $gt: '' } } })"
      )
    })

    it('renders no index lines when the model has no uniques', () => {
      // WHEN
      const mongo = renderMongo(license)

      // THEN
      expect(mongo.indexLines).toEqual([])
    })
  })

  describe('mapper lines', () => {
    it('maps the pk through _id in both directions', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN
      expect(mongo.toDomainProps).toContain('id: doc._id')
      expect(mongo.toPersistenceProps).toContain('_id: primitives.id')
    })

    it('keeps the optionalPrimitive fallback of the typeorm mapper', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — taxId: primitives opcionales caen al default de columna ('')
      expect(mongo.toPersistenceProps).toContain("taxId: primitives.taxId ?? ''")
    })
  })

  describe('composition (embedded children)', () => {
    it('renders the embedded child schema bindings for customer.contacts', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN
      expect(mongo.child?.schemaConst).toBe('ContactSchema')
      expect(mongo.child?.docFields.find(f => f.name === 'id')?.defSrc).toBe('{ type: String, required: true }')
      // el hijo embebido conserva el shape completo de sus primitives (id incluido, sin _id propio)
      expect(mongo.child?.toPersistenceProps).toContain('id: primitives.id')
    })

    it('renders no child bindings without composition', () => {
      // WHEN
      const mongo = renderMongo(license)

      // THEN
      expect(mongo.child).toBeNull()
    })
  })
})
