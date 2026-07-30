import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { SecretsPort } from '@acc/infra-ports'
import { AwsSecretsReader } from '@acc/infra-config-aws'

/** AWS Secrets Manager adapter for the SecretsPort (missing secret → null, as the port mandates). */
export class AwsSecretsManagerSecrets extends SecretsPort {
  constructor(private readonly client: AwsSecretsReader) {
    super()
  }

  async get(name: string): Promise<string | null> {
    try {
      const result = await this.client.send(new GetSecretValueCommand({ SecretId: name }))
      return result.SecretString ?? null
    } catch (error) {
      if ((error as { name?: string })?.name === 'ResourceNotFoundException') return null
      throw error
    }
  }
}
