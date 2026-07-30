import { SecretsPort } from '@acc/infra/ports'
import { SecretReader } from '@acc/infra/config-azure'

/** Azure Key Vault adapter over the same structural SecretReader used by config-azure. */
export class AzureKeyVaultSecrets extends SecretsPort {
  constructor(private readonly client: SecretReader) {
    super()
  }

  async get(name: string): Promise<string | null> {
    try {
      const secret = await this.client.getSecret(name)
      return secret.value ?? null
    } catch (error) {
      if ((error as { statusCode?: number })?.statusCode === 404) return null
      throw error
    }
  }
}
