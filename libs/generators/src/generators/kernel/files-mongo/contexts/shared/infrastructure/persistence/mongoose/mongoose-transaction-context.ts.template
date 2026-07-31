import { AsyncLocalStorage } from 'async_hooks'
import { ClientSession } from 'mongoose'

export class MongooseTransactionContext {
  static readonly storage = new AsyncLocalStorage<ClientSession>()
}
