import type { DatabaseEngine } from '../database'
import { selectEngine } from '../plugins/slots'
import { mongoPersistence } from './mongo.provider'
import { postgresPersistence } from './postgres.provider'
import type { PersistenceProvider } from './provider'

/** Un manifiesto por motor. La ranura `database` de `plugins/slots.ts` los expone al usuario. */
export const PERSISTENCE: Record<DatabaseEngine, PersistenceProvider> = {
  postgres: postgresPersistence,
  mongo: mongoPersistence
}

/**
 * El manifiesto del motor pedido. La validación (y el mensaje de error) es la del
 * registro de ranuras: un solo sitio decide qué motores existen. Sin valor, el default
 * de la ranura — hoy postgres.
 */
export function selectPersistence(engine: string | undefined): PersistenceProvider {
  return PERSISTENCE[selectEngine(engine)]
}
