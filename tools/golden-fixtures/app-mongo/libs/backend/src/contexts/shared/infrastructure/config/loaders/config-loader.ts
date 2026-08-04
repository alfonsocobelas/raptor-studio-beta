import { RootValidator, validate } from '../config-validation'
import { loadRawConfig } from './config-sources'

// Los secretos NO viven en los JSON: se dejan como marcadores `vault.*` que resuelve el
// proveedor de infraestructura elegido (p. ej. Key Vault con --infra=azure). Sin proveedor,
// un marcador sin resolver es un error de configuración, no un valor: mejor fallar al
// arrancar que servir peticiones con la cadena "vault.typeorm.password" como contraseña.
const VAULT_PREFIX = 'vault.'

/**
 * Loader base: la config del entorno tal cual viene en los JSON, validada. Es la costura
 * donde un proveedor de infraestructura enchufa su resolución de secretos.
 */
export default async (): Promise<RootValidator> => {
  const config = loadRawConfig()
  const unresolved = findVaultReferences(config)

  if (unresolved.length) {
    throw new Error(
      `La configuración tiene ${unresolved.length} secreto(s) sin resolver (${unresolved.join(', ')}) y esta app no ` +
        'declara proveedor de secretos. Genera con --infra=<proveedor> o sustituye los marcadores por valores reales.'
    )
  }

  return validate(config)
}

function findVaultReferences(value: unknown, path: string[] = []): string[] {
  if (typeof value === 'string') {
    return value.startsWith(VAULT_PREFIX) ? [path.join('.')] : []
  }
  if (typeof value !== 'object' || value === null) {
    return []
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
    findVaultReferences(nested, [...path, key])
  )
}
