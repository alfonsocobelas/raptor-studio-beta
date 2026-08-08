export abstract class TransactionManager {
  abstract runInTransaction<T>(work: () => Promise<T>): Promise<T>
  abstract getEntityManager(): unknown
}
