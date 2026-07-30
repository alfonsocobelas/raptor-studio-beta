import { AsyncLocalStorage } from 'async_hooks'
import { EntityManager } from 'typeorm'

export class TypeOrmTransactionContext {
  static readonly storage = new AsyncLocalStorage<EntityManager>()
}
