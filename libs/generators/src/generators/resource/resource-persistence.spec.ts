import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import type { ResourceDefinition } from '@raptor/schema'
import { resourceGenerator } from './resource'
import { MODELS, registerModels } from './models/registry'

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
 * TASK-01 (spec 76): con un modelo sin VOs (emitAggregate=false, típico de diseños del
 * estudio) el borrado del repositorio estaba hardcodeado a la ruta TypeORM, así que una
 * app mongo se quedaba un `mongoose-x.repository.ts` VACÍO que nadie borraba. El borrado
 * sale del manifiesto del motor (persistenceDir), no de una ruta fija.
 */
describe('resource generator — modelo sin VOs (sin agregado)', () => {
  beforeAll(() => {
    const bare = structuredClone(MODELS['supplier']) as ResourceDefinition
    for (const field of Object.values(bare.fields)) {
      delete (field as unknown as Record<string, unknown>)['vo']
    }
    registerModels([{ ...bare, name: 'ticket', plural: 'tickets' }])
  })

  const emit = async (database: 'postgres' | 'mongo'): Promise<string[]> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'ticket', directory: 'out', database })
    return tree.listChanges().map(change => change.path)
  }

  it('postgres no deja el repositorio TypeORM vacío', async () => {
    const files = await emit('postgres')

    expect(files).not.toContain('out/backend/infrastructure/persistence/typeorm/typeorm-ticket.repository.ts')
  })

  it('mongo no deja el repositorio Mongoose vacío', async () => {
    const files = await emit('mongo')

    expect(files).not.toContain('out/backend/infrastructure/persistence/mongoose/mongoose-ticket.repository.ts')
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
