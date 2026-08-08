import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { sharedDomainGenerator } from './shared-domain'

describe('shared-domain generator', () => {
  let tree: Tree

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace()
    await sharedDomainGenerator(tree, {})
  })

  it('emits per-resource DTOs, composition children and the statics', () => {
    for (const file of [
      'tmp/generated/shared-domain/customer/customer.dto.ts',
      'tmp/generated/shared-domain/customer/customer-detail.dto.ts',
      'tmp/generated/shared-domain/customer/child.dto.ts',
      'tmp/generated/shared-domain/contract/register-contract.dto.ts',
      'tmp/generated/shared-domain/auth/auth-enums.ts',
      'tmp/generated/shared-domain/export/export-format.ts',
      'tmp/generated/shared-domain/index.ts'
    ]) {
      expect(tree.exists(file)).toBe(true)
    }
    // license es read-only (sin formulario): no emite register/update
    expect(tree.exists('tmp/generated/shared-domain/license/register-license.dto.ts')).toBe(false)
  })

  it('types enum fields with their optionsType union and sync fields as nullable strings', () => {
    const dto = tree.read('tmp/generated/shared-domain/customer/customer.dto.ts', 'utf-8') ?? ''
    expect(dto).toContain("export type CustomerClassification = 'cloud' | 'onprem' | 'hybrid'")
    expect(dto).toContain('customerType: CustomerClassification')
    expect(dto).toContain('archivedAt: string | null')
  })

  it('un optionsType con sufijo Enum emite un enum REAL en <entity>-enums.ts (canon contract)', () => {
    // el dialog emitido usa ContractTypeEnum.CLOUD como VALOR: un type union revienta
    // al servir la app (TS2693) — spec 04, el bloqueo que dejó los dialogs a medias
    const enums = tree.read('tmp/generated/shared-domain/contract/contract-enums.ts', 'utf-8') ?? ''
    expect(enums).toContain('export enum ContractTypeEnum {')
    expect(enums).toContain("CLOUD = 'cloud'")
    expect(enums).toContain("MAINTENANCE = 'maintenance'")
    expect(enums).toContain('export enum ContractStatusEnum {')

    const dto = tree.read('tmp/generated/shared-domain/contract/contract.dto.ts', 'utf-8') ?? ''
    expect(dto).toContain("from './contract-enums'")
    expect(dto).not.toContain('export type ContractTypeEnum')

    const register = tree.read('tmp/generated/shared-domain/contract/register-contract.dto.ts', 'utf-8') ?? ''
    expect(register).toContain("from './contract-enums'")

    const barrel = tree.read('tmp/generated/shared-domain/index.ts', 'utf-8') ?? ''
    expect(barrel).toContain("export * from './contract/contract-enums'")
  })

  it('sin sufijo Enum se mantiene el type union inline (canon CustomerClassification)', () => {
    expect(tree.exists('tmp/generated/shared-domain/customer/customer-enums.ts')).toBe(false)

    const dto = tree.read('tmp/generated/shared-domain/customer/customer.dto.ts', 'utf-8') ?? ''
    expect(dto).toContain("export type CustomerClassification = 'cloud' | 'onprem' | 'hybrid'")
  })

  it('keeps sync-managed fields out of register/update DTOs', () => {
    const register = tree.read('tmp/generated/shared-domain/customer/register-customer.dto.ts', 'utf-8') ?? ''
    expect(register).not.toContain('archivedAt')
    expect(register).not.toContain('status')
    expect(register).toContain('sapId: string')
  })
})
