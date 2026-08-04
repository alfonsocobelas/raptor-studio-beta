import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Test, TestingModule } from '@nestjs/testing'
import { CoreConfigModule } from '../../src/contexts/shared/infrastructure/config/config.module'
import { SharedPersistenceModule } from '../../src/contexts/shared/infrastructure/persistence/typeorm/shared-persistence.module'
import { TestRepositoriesModule } from './test-repositories.module'
import { TypeOrmEnvironmentArranger } from './arranger/typeorm-environment-arranger'

let moduleFixture: TestingModule
let dataSource: DataSource
let arranger: TypeOrmEnvironmentArranger

beforeAll(async () => {
  moduleFixture = await Test.createTestingModule({
    imports: [CoreConfigModule, SharedPersistenceModule, TestRepositoriesModule]
  }).compile()

  const app = moduleFixture.createNestApplication()
  await app.init()

  dataSource = moduleFixture.get<DataSource>(DataSource)
  await dataSource.runMigrations()
  arranger = new TypeOrmEnvironmentArranger(dataSource)
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

export { dataSource, arranger, moduleFixture }
