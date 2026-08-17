import { containsVaultReferences, resolvePlaceholders } from '@raptor/infra-ports'
import { createInfisicalReader } from './infisical-secret-resolver'

export class InfisicalSecretsError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown
  ) {
    super(message)
    this.name = 'InfisicalSecretsError'
  }
}

/**
 * Minimal structural contract over Infisical, so tests inject a fake without touching HTTP
 * (same pattern as AwsSecretsReader in config-aws and SecretReader in config-azure).
 */
export interface InfisicalSecretsReader {
  fetchSecret(name: string): Promise<string | undefined>
}

/**
 * Raptor Cloud mirror of the config-azure/config-aws seam: resolves the `vault.*`
 * placeholders of the app's raw config against Infisical. Same key property as its
 * siblings: local/test configs carry no placeholders, so Infisical is never called and no
 * machine identity is needed.
 *
 * Naming: `vault.typeorm.password` → `TYPEORM_PASSWORD`. Infisical names secrets in
 * SCREAMING_SNAKE (its UI and its CLI both do), where Azure uses dashes and AWS slashes.
 */
export async function resolveInfisicalConfig<T>(rawConfig: T, reader?: InfisicalSecretsReader): Promise<T> {
  if (!containsVaultReferences(rawConfig)) {
    return rawConfig
  }

  const secrets = reader ?? createInfisicalReader()
  return resolvePlaceholders(rawConfig, name => getSecretValue(name.toUpperCase(), secrets), { separator: '_' })
}

async function getSecretValue(name: string, reader: InfisicalSecretsReader): Promise<string> {
  const value = await read(name, reader)
  if (value === undefined) {
    throw new InfisicalSecretsError(`Secret ${name} not found in Infisical`)
  }
  return value
}

async function read(name: string, reader: InfisicalSecretsReader): Promise<string | undefined> {
  try {
    return await reader.fetchSecret(name)
  } catch (error) {
    throw new InfisicalSecretsError(`Failed to read secret ${name} from Infisical`, error)
  }
}
