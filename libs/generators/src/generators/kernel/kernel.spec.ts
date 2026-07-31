import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { kernelGenerator } from './kernel'

describe('kernel generator', () => {
  let tree: Tree

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace()
    await kernelGenerator(tree, {})
  })

  it('scaffolds the kernel pillars the generated modules compile against', () => {
    for (const file of [
      'tmp/generated/kernel/contexts/shared/domain/query/criteria.ts',
      'tmp/generated/kernel/contexts/shared/domain/value-objects/string-value-object.ts',
      'tmp/generated/kernel/contexts/shared/infrastructure/persistence/typeorm/typeorm.repository.ts',
      'tmp/generated/kernel/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module.ts',
      'tmp/generated/kernel/contexts/shared/infrastructure/pipes/parse-criteria.pipe.ts',
      'tmp/generated/kernel/contexts/shared/infrastructure/config/config.module.ts'
    ]) {
      expect(tree.exists(file)).toBe(true)
    }
  })

  it('derives the persistence entity list from the model registry (composition included)', () => {
    const content =
      tree.read('tmp/generated/kernel/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module.ts', 'utf-8') ?? ''
    for (const entity of ['TypeOrmContractEntity', 'TypeOrmCustomerEntity', 'TypeOrmContactEntity', 'TypeOrmProjectEntity']) {
      expect(content).toContain(entity)
    }
  })

  it('parametrizes the shared DTO alias and keeps app-specific config out', () => {
    const roles = tree.read('tmp/generated/kernel/contexts/shared/infrastructure/auth/roles.decorator.ts', 'utf-8') ?? ''
    expect(roles).toContain("from '@acc/shared/domain'")

    const types = tree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/config-types.ts', 'utf-8') ?? ''
    expect(types).not.toContain('SapSync')

    const prod = tree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/environments/prod.json', 'utf-8') ?? ''
    expect(prod).toContain('vault.typeorm.password')
  })
})
