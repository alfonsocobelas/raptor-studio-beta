import { renderMongo } from './build-mongo'
import { customer } from './models/customer.model'
import { contract } from './models/contract.model'
import { license } from './models/license.model'
import { movement } from './models/movement.model'

describe('renderMongo', () => {
  describe('doc fields', () => {
    it('mapea los tipos del modelo a tipos mongoose e incluye el id del dominio como campo', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — el _id del documento lo genera Mongo (ObjectId); el id del dominio es un campo más
      expect(mongo.docFields.find(f => f.name === 'id')?.defSrc).toBe('{ type: String, required: true }')
      const name = mongo.docFields.find(f => f.name === 'name')
      expect(name?.defSrc).toBe('{ type: String, required: true }')
      expect(name?.tsType).toBe('string')
    })

    it('gives nullable fields a null default and optional strings their column default', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — taxId es el unique ifPresent del canon: default '' como su columna varchar
      const taxId = mongo.docFields.find(f => f.name === 'taxId')
      expect(taxId?.defSrc).toBe("{ type: String, default: '' }")

      // notes NO es nullable en el canon (`@Column('varchar', {…, default: '' }) notes!: string`),
      // así que el motor no puede hacerlo nullable: el contrato del dominio es el mismo en ambos
      const notes = mongo.docFields.find(f => f.name === 'notes')
      expect(notes?.defSrc).toBe("{ type: String, default: '' }")
      expect(notes?.tsType).toBe('string')

      // los nullable de verdad del modelo son los timestamps de sync
      const archivedAt = mongo.docFields.find(f => f.name === 'archivedAt')
      expect(archivedAt?.defSrc).toBe('{ type: Date, default: null }')
      expect(archivedAt?.tsType).toBe('Nullable<Date>')
    })

    /**
     * Spec 76: la demo licencias murió sembrando — `subSolutionAreas` es una columna array
     * (`column.array: true`) y el schema emitido decía `String` pelado, así que Mongoose
     * casteaba `[]` a string y el register fallaba en toda app mongo con contract.
     */
    it('los campos array emiten el tipo mongoose entre corchetes con default []', () => {
      // WHEN
      const mongo = renderMongo(contract)

      // THEN
      const areas = mongo.docFields.find(f => f.name === 'subSolutionAreas')
      expect(areas?.defSrc).toBe('{ type: [String], default: [] }')
      expect(areas?.tsType).toBe('string[]')
    })

    it('mapea date a String, porque su primitive es una fecha ISO igual que en Postgres', () => {
      // WHEN
      const mongo = renderMongo(movement)

      // THEN — con `type: Date` el documento guardaría un Date y el shape de primitives
      // dejaría de cuadrar (`movementDate: string`): el contrato no cambia con el motor
      const movementDate = mongo.docFields.find(f => f.name === 'movementDate')
      expect(movementDate?.defSrc).toBe('{ type: String, required: true }')
      expect(movementDate?.tsType).toBe('string')
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
    it('indexa el id del dominio como único: es la identidad de negocio, no la del documento', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — sin este índice dos documentos podrían compartir id de dominio
      expect(mongo.indexLines[0]).toBe('CustomerSchema.index({ id: 1 }, { unique: true })')
    })

    it('renders a plain unique index for required uniques and a partial one for ifPresent uniques', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN
      expect(mongo.indexLines).toContain('CustomerSchema.index({ sapId: 1 }, { unique: true })')
      expect(mongo.indexLines).toContain(
        "CustomerSchema.index({ taxId: 1 }, { unique: true, partialFilterExpression: { taxId: { $gt: '' } } })"
      )
    })

    it('sin únicos de negocio queda solo el índice del id del dominio', () => {
      // WHEN
      const mongo = renderMongo(license)

      // THEN
      expect(mongo.indexLines).toEqual(['LicenseSchema.index({ id: 1 }, { unique: true })'])
    })
  })

  describe('optional uniques (ifPresent)', () => {
    it('lista los únicos opcionales, que son los que necesitan índice parcial', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — sapId es unique+required (índice normal); taxId es el opcional
      expect(mongo.optionalUniques).toEqual(['taxId'])
    })

    it('no lista ninguno cuando todos los únicos son obligatorios', () => {
      // WHEN
      const mongo = renderMongo(movement)

      // THEN
      expect(mongo.optionalUniques).toEqual([])
    })
  })

  describe('mapper lines', () => {
    it('el id del dominio viaja como campo propio, sin tocar el _id del documento', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — el _id es de Mongo y NO debe asomar por el mapper (se filtraría a la API)
      expect(mongo.toDomainProps).toContain('id: doc.id')
      expect(mongo.toPersistenceProps).toContain('id: primitives.id')
      expect(mongo.toDomainProps.join('\n')).not.toContain('_id')
      expect(mongo.toPersistenceProps.join('\n')).not.toContain('_id')
    })

    it('keeps the optionalPrimitive fallback of the typeorm mapper', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — los primitives OPCIONALES (optionalPrimitive) caen al default de su columna;
      // city y country son los del canon, no taxId (que es obligatorio en el mapper emitido)
      expect(mongo.toPersistenceProps).toContain("city: primitives.city ?? ''")
      expect(mongo.toPersistenceProps).toContain("country: primitives.country ?? ''")
      expect(mongo.toPersistenceProps).toContain('taxId: primitives.taxId')
    })

    it('mirrors the nullable-date handling of the typeorm mapper in both directions', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN — Nullable<Date>: se serializa a ISO al salir y se reconstruye Date al entrar
      expect(mongo.toDomainProps).toContain('archivedAt: doc.archivedAt?.toISOString() ?? null')
      expect(mongo.toPersistenceProps).toContain(
        'archivedAt: primitives.archivedAt ? new Date(primitives.archivedAt) : null'
      )
    })
  })

  describe('composition (embedded children)', () => {
    it('renders the embedded child schema bindings for customer.contacts', () => {
      // WHEN
      const mongo = renderMongo(customer)

      // THEN
      expect(mongo.child?.schemaConst).toBe('ContactSchema')
      // la propiedad del padre que los contiene: el array embebido del documento
      expect(mongo.child?.childrenProp).toBe('contacts')
      // el hijo NO lleva la clave del padre: el documento del padre ya lo contiene
      expect(mongo.child?.docFields.find(f => f.name === 'customerId')).toBeUndefined()
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
