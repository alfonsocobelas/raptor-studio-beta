import { SecretClient } from '@azure/keyvault-secrets'
import { DefaultAzureCredential } from '@azure/identity'
import { AzureKeyVaultError } from '../../../../domain/errors'

const VAULT_PREFIX = 'vault.'

/**
 * Minimal contract needed to read secrets. `SecretClient` satisfies it
 * structurally, so tests can inject a fake without the Azure SDK.
 */
export interface SecretReader {
  getSecret(name: string): Promise<{ value?: string }>
}

/** True when any (possibly nested) value is a `vault.*` placeholder. */
export function containsVaultReferences(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.startsWith(VAULT_PREFIX)
  }

  if (Array.isArray(value)) {
    return value.some(containsVaultReferences)
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).some(containsVaultReferences)
  }

  return false
}

/**
 * Deep-clones `config`, replacing every `vault.*` string with its Key Vault
 * secret value. Non-vault values are returned untouched.
 */
export async function resolveSecrets<T>(config: T, client: SecretReader): Promise<T> {
  if (typeof config === 'string' && config.startsWith(VAULT_PREFIX)) {
    return (await getSecretValue(config, client)) as unknown as T
  }

  if (Array.isArray(config)) {
    return (await Promise.all(config.map(item => resolveSecrets(item, client)))) as unknown as T
  }

  if (config !== null && typeof config === 'object') {
    const resolved: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(config)) {
      resolved[key] = await resolveSecrets(value, client)
    }

    return resolved as T
  }

  return config
}

/** Builds the real Key Vault client from `AZURE_KEYVAULT_URL`. */
export function createSecretClient(): SecretClient {
  const keyVaultUrl = process.env['AZURE_KEYVAULT_URL']

  if (!keyVaultUrl) {
    throw new AzureKeyVaultError('Azure Key Vault URL is not defined')
  }

  return new SecretClient(keyVaultUrl, new DefaultAzureCredential())
}

async function getSecretValue(reference: string, client: SecretReader): Promise<string | undefined> {
  const secretName = reference.slice(VAULT_PREFIX.length).replace(/\./g, '-')

  try {
    const secret = await client.getSecret(secretName)
    return secret.value
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode
    throw new AzureKeyVaultError(`Failed to fetch secret [${secretName}] from Azure Key Vault`, status, error)
  }
}
