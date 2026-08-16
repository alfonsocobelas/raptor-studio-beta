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

describe('detail — la ficha del registro (spec 16)', () => {
  it('acepta un recurso que declara ficha (la presencia basta: todo se deriva)', () => {
    const model = defineResource({ ...validDefinition(), detail: {} })

    expect(model.detail).toEqual({})
  })

  it('rechaza una ficha con un campo de título que no existe', () => {
    expect(() => defineResource({ ...validDefinition(), detail: { title: 'inexistente' } })).toThrow(
      /detail.*inexistente/i
    )
  })

  it('rechaza adjuntos sin ficha: los ficheros son de un registro y se ven en su ficha', () => {
    expect(() => defineResource({ ...validDefinition(), attachments: true })).toThrow(/attachments.*detail/i)
  })

  it('rechaza la ficha si el listado no ofrece la acción de ver: sería inalcanzable', () => {
    expect(() =>
      defineResource({
        ...validDefinition(),
        detail: {},
        list: { ...validDefinition().list, features: { view: false } }
      })
    ).toThrow(/detail.*view/i)
  })
})

describe('gallery — tarjetas en vez de tabla (spec 17)', () => {
  it('acepta un recurso que declara galería (todo se deriva de los campos)', () => {
    const model = defineResource({ ...validDefinition(), gallery: {} })

    expect(model.gallery).toEqual({})
  })

  it('rechaza una galería cuyo título apunta a un campo inexistente', () => {
    expect(() => defineResource({ ...validDefinition(), gallery: { title: 'fantasma' } })).toThrow(/gallery.*fantasma/i)
  })

  it('rechaza una galería cuya métrica apunta a un campo inexistente', () => {
    expect(() => defineResource({ ...validDefinition(), gallery: { metric: 'fantasma' } })).toThrow(
      /gallery.*fantasma/i
    )
  })
})

describe('gantt — cronograma derivado del period (spec 30)', () => {
  const withPeriod = (): ResourceDefinition => {
    const base = validDefinition()
    return {
      ...base,
      period: { start: 'startDate', end: 'endDate' },
      fields: {
        ...base.fields,
        startDate: { type: 'date' },
        endDate: { type: 'date', nullable: true }
      }
    }
  }

  it('acepta un recurso con period que declara cronograma', () => {
    const model = defineResource({ ...withPeriod(), gantt: {} })

    expect(model.gantt).toEqual({})
  })

  it('rechaza el cronograma sin period: no hay fechas con las que dibujar barras', () => {
    expect(() => defineResource({ ...validDefinition(), gantt: {} })).toThrow(/gantt.*period/i)
  })

  it('rechaza un título que apunta a un campo inexistente', () => {
    expect(() => defineResource({ ...withPeriod(), gantt: { title: 'fantasma' } })).toThrow(/gantt.*fantasma/i)
  })
})

describe('history — historial de cambios (spec 31)', () => {
  it('acepta un recurso que declara historial; su presencia es lo que lo emite', () => {
    const model = defineResource({ ...validDefinition(), history: true })

    expect(model.history).toBe(true)
  })
})

describe('code — código de negocio autogenerado (spec 19)', () => {
  it('acepta un recurso que declara código, con prefijo derivado', () => {
    expect(defineResource({ ...validDefinition(), code: {} }).code).toEqual({})
  })

  it('acepta prefijo y relleno explícitos', () => {
    const model = defineResource({ ...validDefinition(), code: { prefix: 'EXP', padding: 6 } })

    expect(model.code).toEqual({ prefix: 'EXP', padding: 6 })
  })

  it('rechaza un prefijo que no sea corto y en mayúsculas: es un código, no una frase', () => {
    expect(() => defineResource({ ...validDefinition(), code: { prefix: 'expediente' } })).toThrow(/code.*prefix/i)
  })

  it('rechaza un relleno absurdo', () => {
    expect(() => defineResource({ ...validDefinition(), code: { padding: 0 } })).toThrow(/code.*padding/i)
    expect(() => defineResource({ ...validDefinition(), code: { padding: 12 } })).toThrow(/code.*padding/i)
  })

  it('rechaza declarar código si ya hay un campo llamado code', () => {
    const definition = validDefinition()
    definition.fields['code'] = { type: 'string' }

    expect(() => defineResource({ ...definition, code: {} })).toThrow(/code.*already|ya existe/i)
  })
})

/** Spec 22: en la entidad no hay glosario ni reglas — hay una frase (tope 500). */
describe('brief — la frase de negocio de la entidad (spec 22)', () => {
  it('acepta una frase y la conserva', () => {
    const definition = {
      ...validDefinition(),
      brief: 'Una propiedad en cartera; su estado gobierna qué se puede hacer con ella.'
    }

    expect(() => defineResource(definition)).not.toThrow()
  })

  it('rechaza el brief en blanco', () => {
    expect(() => defineResource({ ...validDefinition(), brief: '   ' })).toThrow(/brief: must be a non-empty string/)
  })

  it('corta por el tope (500)', () => {
    expect(() => defineResource({ ...validDefinition(), brief: 'x'.repeat(501) })).toThrow(
      /brief: exceeds 500 characters/
    )
  })
})

/**
 * Spec 43: la máquina de estados — un enum promovido a estado con transiciones dibujables.
 * La regla de negocio es la flecha que existe o no existe; el gate garantiza que toda
 * flecha habla de valores reales del enum y que el código emitido no puede colisionar.
 */
describe('state — la máquina de estados de la entidad (spec 43)', () => {
  const withState = (state?: unknown): ResourceDefinition => {
    const definition = validDefinition()
    definition.fields['status'] = {
      type: 'string',
      vo: { name: 'ContractStatus', fieldName: 'Status', values: ['draft', 'signed', 'archived'] },
      form: { control: 'select', label: 'Estado' },
      table: { show: true, label: 'Estado', minWidth: 120 }
    }
    return { ...definition, state: state as ResourceDefinition['state'] }
  }

  const machine = () => ({
    field: 'status',
    initial: 'draft',
    transitions: [
      { name: 'sign', label: 'Firmar', from: ['draft'], to: 'signed' },
      { name: 'archive', label: 'Archivar', from: ['signed'], to: 'archived' }
    ]
  })

  it('acepta una máquina válida y la conserva', () => {
    expect(() => defineResource(withState(machine()))).not.toThrow()
  })

  it('rechaza anclarla a un campo que no existe', () => {
    expect(problemsOf(withState({ ...machine(), field: 'ghost' }))).toContain(
      "state.field: field 'ghost' does not exist"
    )
  })

  it('rechaza anclarla a un campo que no es enum (sin vo.values)', () => {
    expect(problemsOf(withState({ ...machine(), field: 'contractNumber' }))).toContain(
      "state.field: field 'contractNumber' is not an enum (vo.values)"
    )
  })

  it('rechaza un initial que no es valor del enum', () => {
    expect(problemsOf(withState({ ...machine(), initial: 'nada' }))).toContain(
      "state.initial: 'nada' is not a value of 'status'"
    )
  })

  it('rechaza from y to fuera del enum, señalando la transición', () => {
    const bad = machine()
    bad.transitions[0] = { name: 'sign', label: 'Firmar', from: ['ghost'], to: 'signed' }
    bad.transitions[1] = { name: 'archive', label: 'Archivar', from: ['signed'], to: 'limbo' }

    const problems = problemsOf(withState(bad))

    expect(problems).toContain("state.transitions[0]: from 'ghost' is not a value of 'status'")
    expect(problems).toContain("state.transitions[1]: to 'limbo' is not a value of 'status'")
  })

  it('rechaza nombres duplicados de transición', () => {
    const bad = machine()
    bad.transitions[1] = { ...bad.transitions[1], name: 'sign' }

    expect(problemsOf(withState(bad))).toContain("state.transitions: duplicated name 'sign'")
  })

  it('rechaza un name que no es kebab-case o pisa una ruta del CRUD emitido', () => {
    const kebab = machine()
    kebab.transitions[0] = { ...kebab.transitions[0], name: 'Sign It' }
    expect(problemsOf(withState(kebab))).toContain('state.transitions[0]: name must be non-empty kebab-case')

    const reserved = machine()
    reserved.transitions[0] = { ...reserved.transitions[0], name: 'export' }
    expect(problemsOf(withState(reserved))).toContain(
      "state.transitions[0]: name 'export' collides with an emitted route"
    )
  })

  it('rechaza from vacío y el destino dentro de su propio from', () => {
    const empty = machine()
    empty.transitions[0] = { ...empty.transitions[0], from: [] }
    expect(problemsOf(withState(empty))).toContain('state.transitions[0]: from must have at least one value')

    const loop = machine()
    loop.transitions[0] = { name: 'sign', label: 'Firmar', from: ['draft', 'signed'], to: 'signed' }
    expect(problemsOf(withState(loop))).toContain(
      "state.transitions[0]: to 'signed' cannot be inside its own from (re-applying is already a no-op)"
    )
  })

  it('respeta los topes: transiciones, name y label', () => {
    const crowded = machine()
    crowded.transitions = Array.from({ length: 21 }, (_, i) => ({
      name: `t-${i}`,
      label: `T${i}`,
      from: ['draft'],
      to: 'signed'
    }))
    expect(problemsOf(withState(crowded))).toContain('state.transitions: at most 20 transitions are allowed (found 21)')

    const long = machine()
    long.transitions[0] = { ...long.transitions[0], label: 'x'.repeat(41) }
    expect(problemsOf(withState(long))).toContain('state.transitions[0]: label must be 1-40 characters')
  })

  it('dos transiciones distintas hacia el mismo destino son legales (rechazar y descartar)', () => {
    const twin = machine()
    twin.transitions.push({ name: 'discard', label: 'Descartar', from: ['draft'], to: 'archived' })

    expect(() => defineResource(withState(twin))).not.toThrow()
  })
})

/**
 * Spec 46: la matriz de accesos actor→capacidad. Admin es implícito y no negociable;
 * el gate solo vigila que la matriz hable de roles legales y de verbos que existen.
 * Un array vacío es LEGAL: «solo admin» es una decisión, no un error.
 */
describe('access — la matriz de accesos (spec 46)', () => {
  const withAccess = (access: unknown, state?: unknown): ResourceDefinition => {
    const definition = validDefinition()
    definition.fields['status'] = {
      type: 'string',
      vo: { name: 'ContractStatus', fieldName: 'Status', values: ['draft', 'signed'] }
    }
    return {
      ...definition,
      state: state as ResourceDefinition['state'],
      access: access as ResourceDefinition['access']
    }
  }

  const machine = () => ({
    field: 'status',
    initial: 'draft',
    transitions: [{ name: 'sign', label: 'Firmar', from: ['draft'], to: 'signed' }]
  })

  it('acepta una matriz completa y válida', () => {
    const access = { view: ['user', 'viewer'], manage: ['user'], transitions: { sign: ['user'] } }

    expect(() => defineResource(withAccess(access, machine()))).not.toThrow()
  })

  it('acepta arrays vacíos: «solo admin» es una decisión', () => {
    expect(() => defineResource(withAccess({ view: [], manage: [] }))).not.toThrow()
  })

  it('rechaza roles ilegales en view y manage', () => {
    const problems = problemsOf(withAccess({ view: ['admin'], manage: ['boss'] }))

    expect(problems).toContain("access.view: 'admin' is not a grantable role (use 'user' or 'viewer'; admin is implicit)")
    expect(problems).toContain("access.manage: 'boss' is not a grantable role (use 'user' or 'viewer'; admin is implicit)")
  })

  it('rechaza duplicados en cada array', () => {
    expect(problemsOf(withAccess({ view: ['user', 'user'] }))).toContain("access.view: duplicated role 'user'")
  })

  it('rechaza transitions sobre un recurso sin máquina de estados', () => {
    expect(problemsOf(withAccess({ transitions: { sign: ['user'] } }))).toContain(
      'access.transitions: the resource has no state machine'
    )
  })

  it('rechaza un verbo que no existe en la máquina', () => {
    expect(problemsOf(withAccess({ transitions: { ghost: ['user'] } }, machine()))).toContain(
      "access.transitions: 'ghost' is not a transition of the state machine (has: sign)"
    )
  })

  it('vigila roles ilegales y duplicados también dentro de transitions', () => {
    const problems = problemsOf(withAccess({ transitions: { sign: ['admin', 'user', 'user'] } }, machine()))

    expect(problems).toContain(
      "access.transitions.sign: 'admin' is not a grantable role (use 'user' or 'viewer'; admin is implicit)"
    )
    expect(problems).toContain("access.transitions.sign: duplicated role 'user'")
  })
})
