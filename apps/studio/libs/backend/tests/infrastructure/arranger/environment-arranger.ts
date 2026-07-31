import { Nullable } from '../../../src/contexts/shared/domain/types'

export abstract class EnvironmentArranger {
  abstract arrange(): Promise<void>
  abstract close(): Promise<void>
  abstract insertOne<EntityType, DataType>(entity: { new (): EntityType }, data: DataType): Promise<void>
  abstract insertMany<EntityType, DataType>(entity: { new (): EntityType }, dataArray: DataType[]): Promise<void>
  abstract findOneBy<T>(entity: { new (): T }, query: Partial<T>): Promise<Nullable<T>>
  abstract find<T>(entity: { new (): T }, query: Partial<T>): Promise<T[]>
}
