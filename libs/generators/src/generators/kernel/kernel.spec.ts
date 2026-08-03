import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { kernelGenerator } from './kernel'
import type { DatabaseEngine } from '../app/database'

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

  it('emits mongo config (uri-based) when the app targets mongo', async () => {
    const mongoTree = createTreeWithEmptyWorkspace()
    await kernelGenerator(mongoTree, { database: 'mongo' })

    const types = mongoTree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/config-types.ts', 'utf-8') ?? ''
    expect(types).toContain('MongoConfig')
    expect(types).not.toContain('TypeOrmConfig')

    const validation =
      mongoTree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/config-validation.ts', 'utf-8') ?? ''
    expect(validation).toContain('MongoValidator')
    expect(validation).not.toContain('TypeOrmValidator')

    const local =
      mongoTree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/environments/local.json', 'utf-8') ?? ''
    expect(local).toContain('mongodb://')
    expect(local).not.toContain('typeorm')

    const prod =
      mongoTree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/environments/prod.json', 'utf-8') ?? ''
    expect(prod).toContain('vault.mongo.uri')
  })

  it('emits the mongoose shared persistence (module, base repo, tx) instead of typeorm when the app targets mongo', async () => {
    const mongoTree = createTreeWithEmptyWorkspace()
    await kernelGenerator(mongoTree, { database: 'mongo' })

    const base = 'tmp/generated/kernel/contexts/shared/infrastructure/persistence'
    for (const file of [
      `${base}/mongoose/shared-persistence.module.ts`,
      `${base}/mongoose/mongoose.repository.ts`,
      `${base}/mongoose/mongoose-transaction-manager.ts`,
      `${base}/mongoose/mongoose-transaction-context.ts`
    ]) {
      expect(mongoTree.exists(file)).toBe(true)
    }
    expect(mongoTree.exists(`${base}/typeorm/typeorm.repository.ts`)).toBe(false)

    const module = mongoTree.read(`${base}/mongoose/shared-persistence.module.ts`, 'utf-8') ?? ''
    // los schemas se derivan del registro de modelos, como las entities en typeorm
    for (const schema of ['ContractSchema', 'CustomerSchema', 'ProjectSchema']) {
      expect(module).toContain(schema)
    }
    // los hijos de composición van embebidos: no se registran como modelo raíz
    expect(module).not.toContain("name: 'Contact'")
  })

  it('emits the mongoose criteria converter with full operator parity', async () => {
    const mongoTree = createTreeWithEmptyWorkspace()
    await kernelGenerator(mongoTree, { database: 'mongo' })

    const converter =
      mongoTree.read(
        'tmp/generated/kernel/contexts/shared/infrastructure/persistence/mongoose/mongoose-criteria-converter.ts',
        'utf-8'
      ) ?? ''
    for (const operator of [
      'Operator.EQUAL',
      'Operator.NOT_EQUAL',
      'Operator.IN',
      'Operator.GT',
      'Operator.GTE',
      'Operator.LT',
      'Operator.LTE',
      'Operator.CONTAINS',
      'Operator.NOT_CONTAINS',
      'Operator.STARTS_WITH',
      'Operator.ENDS_WITH'
    ]) {
      expect(converter).toContain(operator)
    }
    // búsqueda global y cursor keyset presentes, como en el converter typeorm
    expect(converter).toContain('generateSearch')
    expect(converter).toContain('generateCursor')
  })

  it('keeps the postgres config untouched by default', () => {
    const types = tree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/config-types.ts', 'utf-8') ?? ''
    expect(types).toContain('TypeOrmConfig')
    expect(types).not.toContain('MongoConfig')
  })

  it('parametrizes the shared DTO alias and keeps app-specific config out', () => {
    const roles = tree.read('tmp/generated/kernel/contexts/shared/infrastructure/auth/roles.decorator.ts', 'utf-8') ?? ''
    expect(roles).toContain("from '@acc/shared/domain'")

    const types = tree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/config-types.ts', 'utf-8') ?? ''
    expect(types).not.toContain('SapSync')

    const prod = tree.read('tmp/generated/kernel/contexts/shared/infrastructure/config/environments/prod.json', 'utf-8') ?? ''
    expect(prod).toContain('vault.typeorm.password')
  })

  it('rejects an engine without persistence manifest instead of failing on a missing template dir', async () => {
    // TASK-06 (spec 23): el subárbol lo dicta el manifiesto; sin manifiesto el error es explícito
    // y no un ENOENT opaco de `files-<lo que sea>` dentro de generateFiles
    const orphan = createTreeWithEmptyWorkspace()

    await expect(kernelGenerator(orphan, { database: 'oracle' as DatabaseEngine })).rejects.toThrow(
      /Unknown database 'oracle'.*postgres, mongo/
    )
  })
})
