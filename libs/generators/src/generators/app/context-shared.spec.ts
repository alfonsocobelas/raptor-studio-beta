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
