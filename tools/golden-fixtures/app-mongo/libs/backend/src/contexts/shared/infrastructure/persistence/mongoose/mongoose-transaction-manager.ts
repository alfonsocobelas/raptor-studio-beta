import { Injectable } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { ClientSession, Connection } from 'mongoose'
import { TransactionManager } from '../../../domain/persistence/transaction-manager'
import { MongooseTransactionContext } from './mongoose-transaction-context'

@Injectable()
export class MongooseTransactionManager extends TransactionManager {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super()
  }

  // withTransaction reintenta ante TransientTransactionError; exige replica set
  // (single-node rs0 en local/test, Atlas/CosmosDB en cloud).
  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const session = await this.connection.startSession()
    try {
      let result!: T
      await session.withTransaction(async () => {
        result = await MongooseTransactionContext.storage.run(session, work)
      })
      return result
    } finally {
      await session.endSession()
    }
  }

  // Sesión ligada a la transacción ambiental, o null fuera de runInTransaction.
  // Los repositorios la encadenan con .session() para unirse a la transacción activa.
  getEntityManager(): ClientSession | null {
    return MongooseTransactionContext.storage.getStore() ?? null
  }
}
