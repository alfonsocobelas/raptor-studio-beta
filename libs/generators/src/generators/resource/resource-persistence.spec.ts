import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * TASK-07 (spec 23): la persistencia POR RECURSO también la manda el manifiesto del motor.
 * Hasta ahora las plantillas TypeORM vivían dentro del árbol que se emite siempre, así que
 * una app mongo se llevaba entidades y repositorios TypeORM además de su kernel Mongoose.
 */
describe('resource generator — persistencia por motor', () => {
  const emit = async (database?: 'postgres' | 'mongo'): Promise<string[]> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'customer', directory: 'out', database })
    return tree.listChanges().map(change => change.path)
  }

  it('postgres emite la entidad, el mapper y el repositorio TypeORM del recurso', async () => {
    const files = await emit('postgres')

    expect(files).toContain('out/backend/infrastructure/persistence/typeorm/typeorm-customer.entity.ts')
    expect(files).toContain('out/backend/infrastructure/persistence/typeorm/typeorm-customer.repository.ts')
    // la entidad del hijo de composición sale del árbol de composición, también por motor
    expect(files).toContain('out/backend/infrastructure/persistence/typeorm/typeorm-contact.entity.ts')
    expect(files).toContain('out/backend-tests-integration/typeorm-customer.repository.test.ts')
  })

  it('omitir la opción equivale a postgres', async () => {
    expect(await emit()).toEqual(await emit('postgres'))
  })

  it('mongo no emite NADA de TypeORM por recurso', async () => {
    const files = await emit('mongo')

    expect(files.filter(f => f.toLowerCase().includes('typeorm'))).toEqual([])
  })

  it('mongo emite el schema del documento y su mapper (TASK-06)', async () => {
    const files = await emit('mongo')

    expect(files).toContain('out/backend/infrastructure/persistence/mongoose/customer.schema.ts')
    expect(files).toContain('out/backend/infrastructure/persistence/mongoose/customer.mapper.ts')
  })

  it('mongo emite su repositorio concreto (TASK-07)', async () => {
    const files = await emit('mongo')

    expect(files).toContain('out/backend/infrastructure/persistence/mongoose/mongoose-customer.repository.ts')
  })

  it('mongo emite su test de integración, no el de TypeORM (TASK-08)', async () => {
    const files = await emit('mongo')

    expect(files).toContain('out/backend-tests-integration/mongoose-customer.repository.test.ts')
    expect(files).not.toContain('out/backend-tests-integration/typeorm-customer.repository.test.ts')
  })
})

/**
 * TASK-07 (spec 06 re-encajada): el binding de inyección de dependencias del módulo
 * emitido estaba hardcodeado a TypeORM en la plantilla. Lo dicta el manifiesto del motor.
 */
describe('resource generator — binding de DI del módulo', () => {
  const moduleOf = async (database: 'postgres' | 'mongo'): Promise<string> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'customer', directory: 'out', database })
    return tree.read('out/backend/customers.module.ts', 'utf-8') ?? ''
  }

  it('postgres registra el repositorio TypeORM', async () => {
    const module = await moduleOf('postgres')

    expect(module).toContain('{ provide: CustomerRepository, useClass: TypeOrmCustomerRepository }')
    expect(module).toContain(
      "import { TypeOrmCustomerRepository } from './infrastructure/persistence/typeorm/typeorm-customer.repository'"
    )
  })

  it('mongo registra el repositorio Mongoose y no menciona TypeORM', async () => {
    const module = await moduleOf('mongo')

    expect(module).toContain('{ provide: CustomerRepository, useClass: MongooseCustomerRepository }')
    expect(module).toContain(
      "import { MongooseCustomerRepository } from './infrastructure/persistence/mongoose/mongoose-customer.repository'"
    )
    expect(module).not.toContain('TypeOrm')
  })
})
