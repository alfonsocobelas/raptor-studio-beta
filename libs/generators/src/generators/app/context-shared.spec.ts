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

  it('los kind todavía sin plantilla no se emiten (string, period)', () => {
    expect(tree.exists(`apps/demo/libs/backend/${src}/customer-name.vo.ts`)).toBe(false)
    expect(tree.exists(`apps/demo/libs/backend/${src}/period.vo.ts`)).toBe(false)
  })
})
