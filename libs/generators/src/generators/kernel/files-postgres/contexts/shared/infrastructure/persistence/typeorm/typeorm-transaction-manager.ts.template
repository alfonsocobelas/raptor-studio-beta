import { Injectable } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import { TransactionManager } from '../../../domain/persistence/transaction-manager'
import { TypeOrmTransactionContext } from './typeorm-transaction-context'

@Injectable()
export class TypeOrmTransactionManager extends TransactionManager {
  constructor(private readonly dataSource: DataSource) {
    super()
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.dataSource.transaction(manager => TypeOrmTransactionContext.storage.run(manager, work))
  }

  getEntityManager(): EntityManager {
    return TypeOrmTransactionContext.storage.getStore() ?? this.dataSource.manager
  }
}
