import 'reflect-metadata'
import { getConnectionToken } from '@nestjs/mongoose'
import { Test, TestingModule } from '@nestjs/testing'
import { Connection } from 'mongoose'
import { CoreConfigModule } from '../../src/contexts/shared/infrastructure/config/config.module'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/mongoose/shared-persistence.module'
import { TestRepositoriesModule } from './test-repositories.module'
import { MongooseEnvironmentArranger } from './arranger/mongoose-environment-arranger'

let moduleFixture: TestingModule
let connection: Connection
let arranger: MongooseEnvironmentArranger

beforeAll(async () => {
  moduleFixture = await Test.createTestingModule({
    imports: [CoreConfigModule, SharedPersistenceModule, TestRepositoriesModule]
  }).compile()

  const app = moduleFixture.createNestApplication()
  await app.init()

  connection = moduleFixture.get<Connection>(getConnectionToken())
  // Mongo no tiene migraciones: los índices declarados en los schemas se materializan aquí,
  // o los tests de unicidad no verían ninguna restricción que violar.
  await Promise.all(Object.values(connection.models).map(model => model.syncIndexes()))

  arranger = new MongooseEnvironmentArranger(connection)
}, 30000)

afterAll(async () => {
  if (arranger) {
    await arranger.close()
  }
  if (moduleFixture) {
    await moduleFixture.close()
  }
})

beforeEach(async () => {
  if (arranger) {
    await arranger.arrange()
  }
})

export { connection, arranger, moduleFixture }
