import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { appGenerator } from '../app/app'
import { MODELS, registerModels } from './models/registry'

/**
 * Spec 78: bloqueo optimista por defecto. El agregado emitido transporta `version`
 * como propiedad plana (create=1, fromPrimitives, toPrimitives); el contador lo
 * incrementa el repositorio al persistir, nunca el dominio.
 */
describe('resource generator — bloqueo optimista (dominio)', () => {
  const generate = async (name: string): Promise<Tree> => {
    registerModels([MODELS[name]])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }

  const generateMongo = async (name: string): Promise<Tree> => {
    registerModels([MODELS[name]])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out', database: 'mongo' })
    return tree
  }

  it('el agregado transporta version: ctor, getter, create=1 y primitives', async () => {
    const tree = await generate('customer')
    const aggregate = tree.read('out/backend/domain/customer.ts', 'utf-8') ?? ''

    expect(aggregate).toContain('private readonly _version: number')
    expect(aggregate).toContain('get version(): number')
    expect(aggregate).toContain('version: this._version')
    expect(aggregate).toContain('props.version')
  })

  it('toda entidad nueva nace con version 1 y el dominio no la incrementa', async () => {
    const tree = await generate('customer')
    const aggregate = tree.read('out/backend/domain/customer.ts', 'utf-8') ?? ''

    // register() delega en create() y create() fija la versión inicial
    expect(aggregate).toMatch(/static create\([\s\S]*?\n\s*1[,\n]/)
    expect(aggregate).not.toContain('this._version =')
    expect(aggregate).not.toContain('_version++')
  })

  it('el builder de tests emitido arranca las primitivas con version: 1', async () => {
    const tree = await generate('customer')
    const builder = tree.read('out/backend-tests/customer.builder.ts', 'utf-8') ?? ''

    expect(builder).toContain('version: 1')
  })

  it('la entidad TypeORM lleva la columna version con default 1', async () => {
    const tree = await generate('customer')
    const entity = tree.read('out/backend/infrastructure/persistence/typeorm/typeorm-customer.entity.ts', 'utf-8') ?? ''

    expect(entity).toMatch(/@Column\('int', \{ default: 1 \}\)\n\s*version!: number/)
  })

  it('el mapper TypeORM transporta version en ambas direcciones', async () => {
    const tree = await generate('customer')
    const mapper = tree.read('out/backend/infrastructure/persistence/typeorm/customer.mapper.ts', 'utf-8') ?? ''

    expect(mapper).toContain('version: entity.version')
    expect(mapper).toContain('entity.version = primitives.version')
  })

  it('el save TypeORM es condicional por version y choca con ConcurrencyConflictError', async () => {
    const tree = await generate('customer')
    const repo = tree.read('out/backend/infrastructure/persistence/typeorm/typeorm-customer.repository.ts', 'utf-8') ?? ''

    expect(repo).toContain('ConcurrencyConflictError')
    expect(repo).toContain("version: () => 'version + 1'")
    expect(repo).toMatch(/update\(\s*\{ id: entity\.id, version: entity\.version \}/)
    // register() sigue siendo un insert plano: no hay con quién chocar
    expect(repo).toMatch(/async register[\s\S]*?repository\(\)\.save\(/)
  })

  it('el test de integración emitido cubre el choque de dos saves', async () => {
    const tree = await generate('customer')
    const test = tree.read('out/backend-tests-integration/typeorm-customer.repository.test.ts', 'utf-8') ?? ''

    expect(test).toContain('ConcurrencyConflictError')
  })

  it('el schema Mongoose declara version numérica con default 1 y el mapper la transporta', async () => {
    const tree = await generateMongo('customer')
    const schema = tree.read('out/backend/infrastructure/persistence/mongoose/customer.schema.ts', 'utf-8') ?? ''
    const mapper = tree.read('out/backend/infrastructure/persistence/mongoose/customer.mapper.ts', 'utf-8') ?? ''

    expect(schema).toContain('version: number')
    expect(schema).toContain('version: { type: Number, required: true, default: 1 }')
    expect(mapper).toContain('version: doc.version')
    expect(mapper).toContain('version: primitives.version')
  })

  it('el save Mongoose es condicional por version, sin upsert, y choca con 409', async () => {
    const tree = await generateMongo('customer')
    const repo = tree.read('out/backend/infrastructure/persistence/mongoose/mongoose-customer.repository.ts', 'utf-8') ?? ''

    expect(repo).toContain('ConcurrencyConflictError')
    expect(repo).toContain('{ id: doc.id, version: doc.version }')
    expect(repo).toContain('version: doc.version + 1')
    expect(repo).not.toContain('upsert')
  })

  it('el test de integración Mongoose emitido cubre el choque de dos saves', async () => {
    // la suite de integración la emite el proveedor de persistencia del app generator
    const tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'customer', skipInstall: true, database: 'mongo' })
    const test =
      tree.read('apps/demo/libs/backend/tests/infrastructure/repositories/mongoose-customer.repository.test.ts', 'utf-8') ??
      ''

    expect(test).toContain('ConcurrencyConflictError')
  })

  it('el use case de update exige la version leída y choca antes de mutar (spec 78)', async () => {
    const tree = await generate('customer')
    const input = tree.read('out/backend/application/dtos/update-customer-input.dto.ts', 'utf-8') ?? ''
    const useCase = tree.read('out/backend/application/use-cases/update-customer-usecase.service.ts', 'utf-8') ?? ''

    expect(input).toContain('version: number')
    expect(useCase).toContain('ConcurrencyConflictError')
    // el check va ANTES de updateDetails: no se muta un agregado que ya sabemos desfasado
    expect(useCase.indexOf('ConcurrencyConflictError(')).toBeLessThan(useCase.indexOf('.updateDetails('))
  })

  it('el DTO HTTP de update valida version en el borde y el controller la separa de updates', async () => {
    const tree = await generate('customer')
    const dto = tree.read('out/backend/infrastructure/entrypoints/dtos/update-customer.dto.ts', 'utf-8') ?? ''
    const controller = tree.read('out/backend/infrastructure/entrypoints/customers.controller.ts', 'utf-8') ?? ''

    expect(dto).toMatch(/@IsInt\(\)\n\s*@Min\(1\)\n\s*version!: number/)
    expect(controller).toContain('const { version, ...updates } = body')
    expect(controller).toContain('version,')
  })

  it('el test emitido del use case de update cubre la versión desfasada', async () => {
    const tree = await generate('customer')
    const test = tree.read('out/backend-tests-application/update-customer-usecase.test.ts', 'utf-8') ?? ''

    expect(test).toContain('ConcurrencyConflictError')
  })

  it('la transición exige la version leída: use case, handler, DTO y endpoint (spec 78)', async () => {
    const tree = await generate('contract')
    const useCase = tree.read('out/backend/application/use-cases/terminate-contract-usecase.service.ts', 'utf-8') ?? ''
    const handler = tree.read('out/backend/application/handlers/terminate-contract.handler.ts', 'utf-8') ?? ''
    const dto = tree.read('out/backend/infrastructure/entrypoints/dtos/transition-contract.dto.ts', 'utf-8') ?? ''
    const controller = tree.read('out/backend/infrastructure/entrypoints/contracts.controller.ts', 'utf-8') ?? ''

    expect(useCase).toContain('ConcurrencyConflictError')
    expect(useCase).toContain('version: number')
    // el check va ANTES del verbo de dominio
    expect(useCase.indexOf('ConcurrencyConflictError(')).toBeLessThan(useCase.indexOf('.terminate()'))
    expect(handler).toContain('version: number')
    expect(dto).toMatch(/@IsInt\(\)\n\s*@Min\(1\)\n\s*version!: number/)
    expect(controller).toContain('TransitionContractDto')
    expect(controller).toContain('version: body.version')
  })

  it('sin máquina de estados no se emite el DTO de transición', async () => {
    const tree = await generate('customer')

    expect(tree.exists('out/backend/infrastructure/entrypoints/dtos/transition-customer.dto.ts')).toBe(false)
  })

  it('los PrimitiveProps declaran version: number y los AggregateProps no', async () => {
    const tree = await generate('customer')
    const types = tree.read('out/backend/domain/customer-types.ts', 'utf-8') ?? ''

    expect(types).toMatch(/CustomerPrimitiveProps[\s\S]*?version: number/)
    const aggregateProps = types.match(/type CustomerAggregateProps[\s\S]*?\n}/)?.[0] ?? ''
    expect(aggregateProps).not.toContain('version')
  })
})
