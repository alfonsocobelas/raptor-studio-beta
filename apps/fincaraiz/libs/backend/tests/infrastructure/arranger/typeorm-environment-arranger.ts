import { DataSource, EntityManager } from 'typeorm'
import { Nullable } from '../../../src/contexts/shared/domain/types'
import { EnvironmentArranger } from './environment-arranger'

export class TypeOrmEnvironmentArranger extends EnvironmentArranger {
  constructor(private readonly dataSource: DataSource) {
    super()
  }

  protected client(): EntityManager {
    return this.dataSource.manager
  }

  protected repository<T>(entity: { new (): T }) {
    return this.client().getRepository(entity)
  }

  async arrange(): Promise<void> {
    await this.cleanDatabase()
  }

  async close(): Promise<void> {
    await this.cleanDatabase()
  }

  async insertOne<EntityType, DataType>(entity: { new (): EntityType }, data: DataType): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.repository(entity).save(data as any)
  }

  async insertMany<EntityType, DataType>(entity: { new (): EntityType }, dataArray: DataType[]): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.repository(entity).save(dataArray as any)
  }

  async findOneBy<T>(entity: { new (): T }, query: Partial<T>): Promise<Nullable<T>> {
    return this.repository(entity).findOneBy(query as object) as Promise<Nullable<T>>
  }

  async find<T>(entity: { new (): T }, query: Partial<T>): Promise<T[]> {
    return this.repository(entity).findBy(query as object) as Promise<T[]>
  }

  private async cleanDatabase(): Promise<void> {
    const entities = this.dataSource.entityMetadatas
    const tableNames = entities.map(e => (e.schema ? `"${e.schema}"."${e.tableName}"` : `"${e.tableName}"`)).join(', ')

    if (!tableNames.length) {
      return
    }

    await this.client().query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`)
  }
}
