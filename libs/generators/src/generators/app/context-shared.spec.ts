import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'
import { contextSharedGroups, sharedConstraintEntries } from './context-shared'
import { MODELS } from '../resource/models/registry'

/**
 * Spec 27, TASK-02. `constants.ts` no se copia: se DERIVA del registro de VOs compartidos, y sólo
 * con las claves de los VOs que esta app emite de verdad. Una app sin `Phone` no arrastra su
 * constante — es la diferencia entre generar y copiar el canon.
 */
describe('contextSharedGroups — qué contexto emite qué', () => {
  it('agrupa por contexto la unión de los VOs compartidos de sus modelos', () => {
    const groups = contextSharedGroups([MODELS['contract'], MODELS['project']])

    expect(groups).toEqual([
      { context: 'sap-licensing', vos: ['CustomerName', 'ContractNumber', 'ContractDate', 'SyncTimestamp', 'Period'] }
    ])
  })

  it('un contexto sin VOs compartidos no entra en la emisión', () => {
    expect(contextSharedGroups([MODELS['garment']])).toEqual([])
  })

  it('cada contexto lleva sólo lo suyo', () => {
    const groups = contextSharedGroups([MODELS['customer'], MODELS['garment']])

    expect(groups.map(group => group.context)).toEqual(['sap-licensing'])
  })
})

describe('sharedConstraintEntries — sólo las claves de los VOs emitidos', () => {
  it('deriva MIN/MAX del registro, en el orden del registro', () => {
    expect(sharedConstraintEntries(['CustomerName', 'ContractNumber', 'Phone'])).toEqual([
      'CUSTOMER_NAME: { MIN: 2, MAX: 200 }',
      'CONTRACT_NUMBER: { MIN: 5, MAX: 50 }',
      'PHONE: { MAX: 30 }'
    ])
  })

  it('una app sin Phone no arrastra su constante', () => {
    expect(sharedConstraintEntries(['CustomerName', 'ContractNumber', 'ContractDate'])).toEqual([
      'CUSTOMER_NAME: { MIN: 2, MAX: 200 }',
      'CONTRACT_NUMBER: { MIN: 5, MAX: 50 }'
    ])
  })

  it('un VO sin longitudes no aporta clave (ContractDate, SyncTimestamp, Period)', () => {
    expect(sharedConstraintEntries(['ContractDate', 'SyncTimestamp', 'Period'])).toEqual([])
  })
})

describe('app generator — la carpeta compartida del contexto', () => {
  const constantsOf = (tree: Tree, context: string): string | null => {
    const file = `apps/demo/libs/backend/src/contexts/${context}/shared/domain/constants.ts`
    return tree.exists(file) ? (tree.read(file, 'utf-8') ?? null) : null
  }

  it('emite constants.ts con las claves del canon para los modelos elegidos', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract,project', skipInstall: true })

    expect(constantsOf(tree, 'sap-licensing')).toBe(
      `export const SHARED_CONSTRAINTS = {
  CUSTOMER_NAME: { MIN: 2, MAX: 200 },
  CONTRACT_NUMBER: { MIN: 5, MAX: 50 }
} as const
`
    )
  })

  it('con customer entra PHONE, que contract y project no usan', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'customer', skipInstall: true })

    expect(constantsOf(tree, 'sap-licensing')).toContain('PHONE: { MAX: 30 }')
  })

  it('una app sin VOs compartidos no emite la carpeta', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'garment', skipInstall: true })

    expect(tree.exists('apps/demo/libs/backend/src/contexts/warehouse/shared')).toBe(false)
  })
})

/**
 * TASK-03. El contenido esperado es el del canon (`docs/referencia/…/shared/domain/value-objects/`)
 * salvo el orden de sus imports, que el canon escribe distinto en cada fichero.
 */
describe('app generator — VOs compartidos de fecha y timestamp', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract,project', skipInstall: true })
  })

  const read = (file: string): string => tree.read(`apps/demo/libs/backend/${file}`, 'utf-8') ?? ''
  const src = 'src/contexts/sap-licensing/shared/domain/value-objects'
  const tests = 'tests/modules/sap-licensing/shared/domain/value-objects'

  it('kind date emite el VO del canon, con su unset()', () => {
    expect(read(`${src}/contract-date.vo.ts`)).toBe(
      `import { Nullable } from '../../../../shared/domain/types'
import { DateValueObject } from '../../../../shared/domain/value-objects/date-value-object'

export class ContractDate extends DateValueObject {
  protected static override fieldName = 'Contract date'

  private constructor(value: Date) {
    super(value)
  }

  static create(value: Date): ContractDate {
    this.ensureIsValidDate(value)
    return new ContractDate(value)
  }

  static unset(): Nullable<ContractDate> {
    return null
  }
}
`
    )
  })

  it('kind timestamp emite fromISOString, el null con nombre y toISOString', () => {
    expect(read(`${src}/sync-timestamp.vo.ts`)).toBe(
      `import { Nullable } from '../../../../shared/domain/types'
import { DateValueObject } from '../../../../shared/domain/value-objects/date-value-object'

export class SyncTimestamp extends DateValueObject {
  protected static override fieldName = 'Sync timestamp'

  private constructor(value: Date) {
    super(value)
  }

  static create(value: Date): SyncTimestamp {
    this.ensureIsValidDate(value)
    return new SyncTimestamp(value)
  }

  static fromISOString(value: string): SyncTimestamp {
    return this.create(new Date(value))
  }

  /** Named null: the timestamped event has never happened. */
  static never(): Nullable<SyncTimestamp> {
    return null
  }

  toISOString(): string {
    return this._value.toISOString()
  }
}
`
    )
  })

  it('los tests del VO se emiten donde el jest de la app los busca', () => {
    expect(read(`${tests}/contract-date.vo.test.ts`)).toContain(
      `import { ContractDate } from '../../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-date.vo'`
    )
    expect(read(`${tests}/contract-date.vo.test.ts`)).toContain('unset() should return null')
    expect(read(`${tests}/sync-timestamp.vo.test.ts`)).toContain('via never()')
  })
})

/**
 * TASK-06. La normalización española se parte en dos: el ALGORITMO (formas jurídicas, conectores,
 * title-case — España, no un cliente) va al kernel; las tablas que sí son del cliente (acrónimos)
 * viajan como dato desde la declaración. Divergencia asumida con el canon: el VO emitido delega en
 * el helper en vez de llevar las 71 líneas dentro.
 */
describe('app generator — la normalización española (spanish-legal-name)', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'customer', skipInstall: true })
  })

  const read = (file: string): string => tree.read(`apps/demo/libs/backend/${file}`, 'utf-8') ?? ''

  it('el algoritmo vive en el kernel, junto al title-case que reutiliza', () => {
    const helper = read('src/contexts/shared/domain/value-objects/spanish-legal-name.ts')

    expect(helper).toContain(`import { capitalizeSpanishWord } from './spanish-title-case'`)
    expect(helper).toContain('export function normalizeSpanishLegalName(raw: string, acronyms: readonly string[])')
    // las formas jurídicas son de España, no del cliente: viven en el helper
    expect(helper).toContain(`[/,?\\s+sociedad\\s+limitada\\s*$/i, ' S.L.']`)
    // los acrónimos NO: son la tabla del cliente y llegan como argumento
    expect(helper).not.toContain('SAP')
  })

  it('el VO emitido delega en el helper con los acrónimos de su declaración', () => {
    const vo = read('src/contexts/sap-licensing/shared/domain/value-objects/customer-name.vo.ts')

    expect(vo).toContain(
      `import { normalizeSpanishLegalName } from '../../../../shared/domain/value-objects/spanish-legal-name'`
    )
    expect(vo).toContain(`const ACRONYMS: readonly string[] = ['SAP', 'AG', 'NTT', 'ELIX', 'IBM', 'ERP']`)
    expect(vo).toContain(`  static normalizeName(raw: string): string {
    return normalizeSpanishLegalName(raw, ACRONYMS)
  }`)
    expect(vo).toContain('if (value.length < SHARED_CONSTRAINTS.CUSTOMER_NAME.MIN) {')
    // create NO normaliza heurísticamente: eso es del borde (el sync), como en el canon
    expect(vo).not.toContain('this.normalizeName')
  })

  it('el test emitido demuestra la normalización con los casos del canon', () => {
    const test = read('tests/modules/sap-licensing/shared/domain/value-objects/customer-name.vo.test.ts')

    expect(test).toContain(`['ACME GESTION SOCIEDAD LIMITADA', 'Acme Gestion S.L.']`)
    expect(test).toContain(`["GOVERN D'ANDORRA", "Govern D'Andorra"]`)
    expect(test).toContain('SA CONSULTORES REUNIDOS')
    expect(test).toContain('should be idempotent for arbitrary strings')
    // los casos de acrónimo se derivan de la tabla declarada, no de valores a mano
    expect(test).toContain(`expect(CustomerName.normalizeName('acme sap services')).toBe('Acme SAP Services')`)
  })
})

/**
 * TASK-05. El período no extiende ValueObject: es una clase propia con su invariante y su error de
 * regla de negocio, y ese error vive un nivel por encima de los VOs (`<contexto>/shared/domain/`).
 */
describe('app generator — el período compartido', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true })
  })

  const read = (file: string): string => tree.read(`apps/demo/libs/backend/${file}`, 'utf-8') ?? ''
  const domain = 'src/contexts/sap-licensing/shared/domain'

  it('emite el error de regla de negocio junto al dominio compartido, no en value-objects', () => {
    expect(read(`${domain}/period-error.ts`)).toBe(
      `import { BusinessRuleViolationError } from '../../../shared/domain/errors'

export class PeriodError extends BusinessRuleViolationError {
  constructor(message: string, cause?: unknown) {
    super(message, 'Period', cause)
  }
}
`
    )
  })

  it('emite el período con su invariante inicio <= fin', () => {
    expect(read(`${domain}/value-objects/period.vo.ts`)).toBe(
      `import { Nullable } from '../../../../shared/domain/types'
import { DateValueObject } from '../../../../shared/domain/value-objects/date-value-object'
import { PeriodError } from '../period-error'

export class Period {
  private constructor(
    private readonly _start: Nullable<DateValueObject>,
    private readonly _end: Nullable<DateValueObject>
  ) {}

  static create(start: Nullable<DateValueObject>, end: Nullable<DateValueObject>): Period {
    if (start && end && end.isBefore(start)) {
      throw new PeriodError('End date must be on or after the start date')
    }
    return new Period(start, end)
  }

  get start(): Nullable<DateValueObject> {
    return this._start
  }

  get end(): Nullable<DateValueObject> {
    return this._end
  }
}
`
    )
  })

  it('el test emitido construye las fechas con el VO que declara `of`', () => {
    const test = read('tests/modules/sap-licensing/shared/domain/value-objects/period.vo.test.ts')

    expect(test).toContain(`const date = (iso: string): ContractDate => ContractDate.create(new Date(iso))`)
    expect(test).toContain('should throw PeriodError when end is before start')
    expect(test).toContain('should create an open-ended period when end is null')
  })
})

/**
 * TASK-04. Las cuatro variantes del canon en `kind: 'string'`: guarda base, longitudes por
 * `constraintKey`, whitespace interior, juego de caracteres y normalización propia.
 */
describe('app generator — VOs compartidos de texto', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'customer,contract', skipInstall: true })
  })

  const read = (file: string): string => tree.read(`apps/demo/libs/backend/${file}`, 'utf-8') ?? ''
  const src = 'src/contexts/sap-licensing/shared/domain/value-objects'
  const tests = 'tests/modules/sap-licensing/shared/domain/value-objects'

  // La fidelidad byte a byte con el canon la firma el gate de oro, que corre el generador de verdad
  // (con prettier); el árbol virtual de este test no formatea. Aquí se comprueba lo que decide el
  // registro: qué guarda, en qué orden y con qué piezas.
  it('min/max por constraintKey + whitespace interior (contract-number)', () => {
    const vo = read(`${src}/contract-number.vo.ts`)

    expect(vo).toContain(`import { SHARED_CONSTRAINTS } from '../constants'`)
    expect(vo).toContain(`export class ContractNumber extends StringValueObject`)
    expect(vo).toContain(`protected static override fieldName = 'Contract number'`)
    expect(vo).toContain('this.ensureIsString(value)')
    expect(vo).toContain('this.ensureHasNoInnerWhitespace(value)')
    expect(vo).toContain('if (value.length < SHARED_CONSTRAINTS.CONTRACT_NUMBER.MIN) {')
    expect(vo).toContain('if (value.length > SHARED_CONSTRAINTS.CONTRACT_NUMBER.MAX) {')
    expect(vo).not.toContain('ALLOWED')
    expect(vo).not.toContain('override normalize')
  })

  it('juego de caracteres + normalize propio (phone)', () => {
    const vo = read(`${src}/phone.vo.ts`)

    expect(vo).toContain('private static readonly ALLOWED = /^[0-9+()\\-/.\\s]+$/')
    expect(vo).toContain('this.ensureIsDefined(value)')
    expect(vo).toContain('if (value.length > 0 && !this.ALLOWED.test(value)) {')
    expect(vo).toContain(
      `throw new InvalidArgumentError('Phone may only contain digits and the symbols + ( ) - / . and spaces')`
    )
    expect(vo).toContain(`  protected static override normalize(value: string): string {
    return value.trim().replace(/\\s+/g, ' ')
  }`)
    expect(vo).not.toContain('MIN')
    expect(vo).not.toContain('ensureHasNoInnerWhitespace')
  })

  it('el test emitido ejercita lo que el VO declara, no lo que otro VO declara', () => {
    const number = read(`${tests}/contract-number.vo.test.ts`)
    const phone = read(`${tests}/phone.vo.test.ts`)

    expect(number).toContain('const MIN = SHARED_CONSTRAINTS.CONTRACT_NUMBER.MIN')
    expect(number).toContain('inner whitespace')
    expect(number).not.toContain('allowlist')

    expect(phone).not.toContain('const MIN')
    expect(phone).toContain('allowlist')
    expect(phone).toContain('should collapse multiple inner spaces to one')
    expect(phone).not.toContain('inner whitespace')
  })
})
