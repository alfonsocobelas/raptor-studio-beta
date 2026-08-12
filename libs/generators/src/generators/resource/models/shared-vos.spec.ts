import { MODEL_LIST } from './registry'
import { SHARED_VOS, sharedVosOf } from './shared-vos'

/**
 * El guard que nos habría ahorrado 49 errores de compilación (spec 26, TASK-05).
 *
 * Un modelo que declara `voShared: { name: 'X' }` está diciendo «este VO no es mío, vive en la capa
 * compartida del contexto». El generador se lo creía: usaba el tipo y lo importaba sin comprobar que
 * alguien lo emitiera. El resultado sólo aparecía compilando el emitido FUERA del monorepo, semanas
 * después. Aquí es suite roja.
 */
describe('SHARED_VOS — el registro cubre todo lo que los modelos referencian', () => {
  it('cada voShared de cada modelo registrado está declarado', () => {
    const missing = new Set<string>()

    for (const model of MODEL_LIST) {
      for (const field of Object.values(model.fields)) {
        const name = field.voShared?.name
        if (name && !SHARED_VOS[name]) missing.add(`${model.name}.${name}`)
      }
    }

    expect([...missing]).toEqual([])
  })

  it('un modelo con período arrastra Period, que no se declara por campo', () => {
    const withPeriod = MODEL_LIST.filter(m => m.period)

    expect(withPeriod.length).toBeGreaterThan(0)
    for (const model of withPeriod) {
      expect(sharedVosOf([model])).toContain('Period')
    }
  })

  /**
   * El mismo agujero que el test de arriba, un nivel más abajo: un VO compuesto declara
   * de qué VO se construye (`Period` → `of: 'ContractDate'`) y el emisor no seguía esa
   * dependencia. En contract/project/license colaba porque sus campos declaran
   * `ContractDate` por su cuenta; `installation` solo declara el período, así que la app
   * solaris salía con un `period.vo.ts` apuntando a un VO nunca emitido: 8 × TS2304 al
   * compilar el emitido. Lo cazó la corrida real del gate de la spec 39.
   */
  it('un VO compuesto arrastra el VO del que se construye', () => {
    const withPeriod = MODEL_LIST.filter(m => m.period)

    for (const model of withPeriod) {
      const emitted = sharedVosOf([model])

      for (const name of emitted) {
        const dependency = SHARED_VOS[name]?.of
        if (dependency) {
          expect(emitted).toContain(dependency)
        }
      }
    }
  })

  it('un modelo cuyo período no declara el VO por campo también lo arrastra', () => {
    // fixture propia: el registro entero sigue el canon (lo exige el guard de más abajo),
    // así que el caso se construye a mano en vez de depender de un modelo concreto
    const sinVoShared = {
      schemaVersion: 1,
      name: 'obra',
      plural: 'obras',
      context: 'demo',
      schemaName: 'demo',
      period: { start: 'desde', end: 'hasta' },
      fields: {
        id: { type: 'uuid', pk: true },
        desde: { type: 'date', nullable: true },
        hasta: { type: 'date', nullable: true }
      }
    } as unknown as (typeof MODEL_LIST)[number]

    expect(sharedVosOf([sinVoShared])).toEqual(['ContractDate', 'Period'])
  })
})

describe('sharedVosOf — sólo lo que la app elige', () => {
  it('devuelve la unión de los modelos seleccionados, sin repetir', () => {
    const contract = MODEL_LIST.find(m => m.name === 'contract')
    const license = MODEL_LIST.find(m => m.name === 'license')
    if (!contract || !license) throw new Error('fixture de modelos incompleta')

    const names = sharedVosOf([contract, license])

    expect(names).toEqual([...new Set(names)])
    expect(names).toContain('ContractNumber')
    expect(names).toContain('CustomerName')
    expect(names).toContain('ContractDate')
    expect(names).toContain('SyncTimestamp')
  })

  it('una app que no los usa no arrastra ninguno', () => {
    const garment = MODEL_LIST.find(m => m.name === 'garment')
    if (!garment) throw new Error('fixture de modelos incompleta')

    expect(sharedVosOf([garment])).toEqual([])
  })

  it('Period arrastra su error de regla de negocio y nada más lo hace', () => {
    const contract = MODEL_LIST.find(m => m.name === 'contract')
    if (!contract) throw new Error('fixture de modelos incompleta')

    expect(SHARED_VOS['Period'].kind).toBe('period')
    expect(sharedVosOf([contract])).toContain('Period')
  })
})

describe('SHARED_VOS — declaraciones medidas contra el canon', () => {
  it('las constantes coinciden con las del canon (shared/domain/constants.ts)', () => {
    // docs/referencia/.../sap-licensing/shared/domain/constants.ts
    expect(SHARED_VOS['CustomerName']).toMatchObject({ constraintKey: 'CUSTOMER_NAME', min: 2, max: 200 })
    expect(SHARED_VOS['ContractNumber']).toMatchObject({ constraintKey: 'CONTRACT_NUMBER', min: 5, max: 50 })
    expect(SHARED_VOS['Phone']).toMatchObject({ constraintKey: 'PHONE', max: 30 })
  })

  it('los VOs de fecha declaran su null con nombre, como el canon', () => {
    // contract-date.vo.ts:17 `static unset()` · sync-timestamp.vo.ts:22 `static never()`
    expect(SHARED_VOS['ContractDate']).toMatchObject({ kind: 'date', unset: true })
    expect(SHARED_VOS['SyncTimestamp']).toMatchObject({ kind: 'timestamp', namedNull: 'never' })
  })

  it('ningún VO compartido declara min/max sin la clave de constante que los aloja', () => {
    for (const [name, vo] of Object.entries(SHARED_VOS)) {
      if (vo.min !== undefined || vo.max !== undefined) {
        expect(vo.constraintKey).toBeDefined()
      }
      expect(name).toMatch(/^[A-Z]/)
    }
  })
})

/**
 * El guard hermano del de arriba, para el período. Un modelo que declara
 * `period: { start, end }` construye su `Period` con el VO compartido de fecha, y sus dos
 * campos tienen que declararlo igual que el canon (contract): `nullable`, el `voShared` del
 * que se construye el período, y columna `Nullable<string>` — porque `Period` admite nulos
 * y `toPrimitives` emite el ternario.
 *
 * Sin esto, `installation` salió con 8 TS2304 (el VO no se importaba) y 2 TS2322 (un null
 * en un campo tipado `string`), y no lo vio nadie hasta compilar la app (spec 39, punto 2).
 */
describe('SHARED_VOS — los campos del período siguen el canon', () => {
  const dateVo = SHARED_VOS['Period']?.of

  it('el período del catálogo declara de qué VO se construye', () => {
    expect(dateVo).toBeTruthy()
  })

  it.each(MODEL_LIST.filter(model => model.period).map(model => [model.name, model] as const))(
    '%s declara sus dos campos de período como el canon',
    (_name, model) => {
      const period = model.period
      if (!period) throw new Error('fixture incoherente')

      for (const fieldName of [period.start, period.end]) {
        const field = model.fields[fieldName]

        expect(field).toBeTruthy()
        expect(field.nullable).toBe(true)
        expect(field.voShared?.name).toBe(dateVo)
        expect(field.column?.tsType).toBe('Nullable<string>')
      }
    }
  )
})
