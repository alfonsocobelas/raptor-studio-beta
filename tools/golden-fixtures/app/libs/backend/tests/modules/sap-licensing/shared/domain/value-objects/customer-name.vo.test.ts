import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../../src/contexts/shared/domain/errors'
import { CustomerName } from '../../../../../../src/contexts/sap-licensing/shared/domain/value-objects/customer-name.vo'
import { SHARED_CONSTRAINTS } from '../../../../../../src/contexts/sap-licensing/shared/domain/constants'

const MAX = SHARED_CONSTRAINTS.CUSTOMER_NAME.MAX
const MIN = SHARED_CONSTRAINTS.CUSTOMER_NAME.MIN

describe('CustomerName (shared)', () => {
  describe('create — invalid inputs', () => {
    it('should throw InvalidArgumentError for null', () => {
      expect(() => CustomerName.create(null as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for undefined', () => {
      expect(() => CustomerName.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for empty string', () => {
      expect(() => CustomerName.create('')).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for whitespace-only string', () => {
      expect(() => CustomerName.create('   ')).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for strings shorter than MIN chars', () => {
      expect(() => CustomerName.create('a'.repeat(MIN - 1))).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for strings exceeding MAX chars', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: MAX + 1, maxLength: MAX + 100 }).map(s => s.replace(/\s/g, 'x')),
          value => {
            expect(() => CustomerName.create(value)).toThrow(InvalidArgumentError)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('create — valid inputs', () => {
    it('should create CustomerName for a typical company name', () => {
      expect(CustomerName.create('Acme Ibérica S.L.').value).toBe('Acme Ibérica S.L.')
    })

    it('should accept strings with exactly MIN chars', () => {
      const value = 'A'.repeat(MIN)
      expect(CustomerName.create(value).value).toBe(value)
    })

    it('should accept strings with exactly MAX chars', () => {
      const value = 'A'.repeat(MAX)
      expect(CustomerName.create(value).value).toBe(value)
    })

    it('should preserve value for any valid string within bounds', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: MIN, maxLength: MAX }).filter(s => s.trim().length >= MIN),
          value => {
            expect(CustomerName.create(value).value).toBe(value.trim())
          }
        ),
        { numRuns: 200 }
      )
    })
  })

  describe('create — does NOT apply heuristic normalization (boundary concern)', () => {
    it('keeps raw casing and legal form untouched, only trimming (normalization is a caller concern)', () => {
      const raw = 'ACME GESTION SOCIEDAD LIMITADA'
      expect(CustomerName.create(raw).value).toBe(raw)
    })

    it('rehydrates a stored value without rewriting it (fromPrimitives-style construction)', () => {
      const stored = 'ACME GESTION, SOCIEDAD LIMITADA'
      expect(CustomerName.create(stored).value).toBe(stored)
    })
  })

  describe('equals', () => {
    it('should return true for same value', () => {
      expect(CustomerName.create('Acme').equals(CustomerName.create('Acme'))).toBe(true)
    })

    it('should return false for different values', () => {
      expect(CustomerName.create('Acme').equals(CustomerName.create('Umbrella'))).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the raw string', () => {
      expect(CustomerName.create('Acme Ibérica').toString()).toBe('Acme Ibérica')
    })
  })

  describe('normalizeName (boundary canonicalization)', () => {
    describe('whitespace', () => {
      it('should trim and collapse inner whitespace', () => {
        expect(CustomerName.normalizeName('  ACME   GESTION  ')).toBe('Acme Gestion')
      })
    })

    // Capitalizar solo la inicial de cada palabra bajaría la mayúscula tras el guion
    // (Antolin-Irausa) y tras el apóstrofe catalán (D'Andorra).
    describe('inner separators', () => {
      it.each([
        ['GRUPO ANTOLIN-IRAUSA', 'Grupo Antolin-Irausa'],
        ['MUTUA UNIVERSAL-MUGENAT', 'Mutua Universal-Mugenat'],
        ["GOVERN D'ANDORRA", "Govern D'Andorra"],
        ["institut municipal d'informatica", "Institut Municipal D'Informatica"]
      ])('should capitalize after inner separators: %s -> %s', (raw, expected) => {
        expect(CustomerName.normalizeName(raw)).toBe(expected)
      })
    })

    describe('legal forms', () => {
      it.each([
        ['ACME GESTION SOCIEDAD LIMITADA', 'Acme Gestion S.L.'],
        ['ACME GESTION, SOCIEDAD LIMITADA', 'Acme Gestion S.L.'],
        ['ACME GESTION SOCIEDAD ANONIMA', 'Acme Gestion S.A.'],
        ['ACME SL', 'Acme S.L.'],
        ['ACME S.L', 'Acme S.L.'],
        ['ACME SL.', 'Acme S.L.'],
        ['ACME S.L.', 'Acme S.L.'],
        ['ACME SA', 'Acme S.A.'],
        ['ACME SLU', 'Acme S.L.U.'],
        ['ACME S.L.U.', 'Acme S.L.U.'],
        ['ACME SAU', 'Acme S.A.U.'],
        ['ACME SC', 'Acme S.C.'],
        ['ACME LEGAL SLP', 'Acme Legal S.L.P.'],
        ['ACME LEGAL S.L.P.', 'Acme Legal S.L.P.'],
        ['ACME SGPS', 'Acme S.G.P.S.'],
        ['ACME S.G.P.S.', 'Acme S.G.P.S.'],
        ['ACME SCOOP', 'Acme S.Coop.'],
        ['ACME S.COOP.', 'Acme S.Coop.']
      ])('should canonicalize "%s" → "%s"', (raw, expected) => {
        expect(CustomerName.normalizeName(raw)).toBe(expected)
      })

      it('should canonicalize a holding form (S.G.P.S) followed by its legal form (S.A.)', () => {
        expect(CustomerName.normalizeName('Gescartão, S.g.p.s S.A.')).toBe('Gescartão S.G.P.S. S.A.')
      })

      it('should drop the trailing period of the word preceding the legal form', () => {
        expect(CustomerName.normalizeName('Facme. S.A.')).toBe('Facme S.A.')
      })

      it('should not touch legal-form-like tokens in the middle of the name', () => {
        expect(CustomerName.normalizeName('SA CONSULTORES REUNIDOS')).toBe('SA Consultores Reunidos')
      })
    })

    describe('title-case and connectors', () => {
      it('should title-case words and lowercase connectors', () => {
        expect(CustomerName.normalizeName('GESTORA DE INFRAESTRUCTURAS Y SERVICIOS DEL NORTE')).toBe(
          'Gestora de Infraestructuras y Servicios del Norte'
        )
      })

      it('should capitalize a connector when it is the first word', () => {
        expect(CustomerName.normalizeName('LA COMERCIAL DEL SUR')).toBe('La Comercial del Sur')
      })

      it('should keep ampersand as-is', () => {
        expect(CustomerName.normalizeName('SMITH & SONS IBERIA')).toBe('Smith & Sons Iberia')
      })

      it('should preserve accented characters while title-casing', () => {
        expect(CustomerName.normalizeName('GESTIÓN AÉREA ESPAÑOLA')).toBe('Gestión Aérea Española')
      })
    })

    describe('acronyms and short words', () => {
      it('should preserve listed acronyms in uppercase', () => {
        expect(CustomerName.normalizeName('acme sap services')).toBe('Acme SAP Services')
        expect(CustomerName.normalizeName('ntt data iberia')).toBe('NTT Data Iberia')
      })

      it('should uppercase unlisted 1-2 letter words (likely acronyms)', () => {
        expect(CustomerName.normalizeName('ab consulting')).toBe('AB Consulting')
      })
    })

    describe('totality and idempotence', () => {
      it('should return empty string for empty input (validation belongs to create)', () => {
        expect(CustomerName.normalizeName('')).toBe('')
        expect(CustomerName.normalizeName('   ')).toBe('')
      })

      it('should be idempotent for arbitrary strings', () => {
        fc.assert(
          fc.property(fc.string({ maxLength: 80 }), value => {
            const once = CustomerName.normalizeName(value)
            expect(CustomerName.normalizeName(once)).toBe(once)
          }),
          { numRuns: 200 }
        )
      })

      it('should be idempotent for already-normalized names', () => {
        const normalized = CustomerName.normalizeName('ACME GESTION, SOCIEDAD LIMITADA')
        expect(CustomerName.normalizeName(normalized)).toBe(normalized)
      })
    })
  })
})

describe('CustomerName — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(CustomerName.create('  AZBIL TELSTAR SL  ').value).toBe('AZBIL TELSTAR SL')
  })
})
