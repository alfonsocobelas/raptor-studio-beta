/** Motor de persistencia de la app emitida. Decisión de app, nunca del resource-schema. */
export type DatabaseEngine = 'postgres' | 'mongo'

const ENGINES: readonly DatabaseEngine[] = ['postgres', 'mongo']

export function selectDatabase(value: string | undefined): DatabaseEngine {
  if (value === undefined) {
    return 'postgres'
  }
  if (!ENGINES.includes(value as DatabaseEngine)) {
    throw new Error(`Unknown database '${value}'. Available: ${ENGINES.join(', ')}`)
  }
  return value as DatabaseEngine
}
