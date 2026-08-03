import type { DatabaseEngine } from '../database'
import { mongoPersistence } from './mongo.provider'
import { postgresPersistence } from './postgres.provider'
import type { PersistenceProvider } from './provider'

/** Un manifiesto por motor. La ranura `database` de `plugins/slots.ts` los expone al usuario. */
export const PERSISTENCE: Record<DatabaseEngine, PersistenceProvider> = {
  postgres: postgresPersistence,
  mongo: mongoPersistence
}

export function selectPersistence(engine: DatabaseEngine): PersistenceProvider {
  return PERSISTENCE[engine]
}
