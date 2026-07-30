import { SecretClient } from '@azure/keyvault-secrets'
import { DefaultAzureCredential } from '@azure/identity'
import { containsVaultReferences, resolvePlaceholders } from '@acc/infra/ports'

export { containsVaultReferences }

export class AzureKeyVaultError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    override readonly cause?: unknown
  ) {
    super(message)
    this.name = 'AzureKeyVaultError'
  }
}

/**
 * Minimal contract needed to read secrets. `SecretClient` satisfies it
 * structurally, so tests can inject a fake without the Azure SDK.
 */
export interface SecretReader {
  getSecret(name: string): Promise<{ value?: string }>
}

/**
 * Deep-clones `config`, replacing every `vault.*` string with its Key Vault
 * secret value (shared walker in @acc/infra/ports; naming: dots → dashes).
 */
export async function resolveSecrets<T>(config: T, client: SecretReader): Promise<T> {
  return resolvePlaceholders(config, name => getSecretValue(name, client))
}

/** Builds the real Key Vault client from `AZURE_KEYVAULT_URL` (DefaultAzureCredential → Managed Identity). */
export function createSecretClient(): SecretClient {
  const keyVaultUrl = process.env['AZURE_KEYVAULT_URL']

  if (!keyVaultUrl) {
    throw new AzureKeyVaultError('Azure Key Vault URL is not defined')
  }

  return new SecretClient(keyVaultUrl, new DefaultAzureCredential())
}

async function getSecretValue(secretName: string, client: SecretReader): Promise<string | undefined> {
  try {
    const secret = await client.getSecret(secretName)
    return secret.value
  } catch (error) {
    const status = (error as { statusCode?: number })?.statusCode
    throw new AzureKeyVaultError(`Failed to fetch secret [${secretName}] from Azure Key Vault`, status, error)
  }
}
