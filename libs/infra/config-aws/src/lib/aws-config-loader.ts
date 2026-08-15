import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { containsVaultReferences, resolvePlaceholders } from '@raptor/infra-ports'

export class AwsSecretsError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown
  ) {
    super(message)
    this.name = 'AwsSecretsError'
  }
}

/**
 * Minimal structural contract over the Secrets Manager client, so tests inject a fake
 * without the SDK (same pattern as SecretReader in config-azure).
 */
export interface AwsSecretsReader {
  send(command: GetSecretValueCommand): Promise<{ SecretString?: string }>
}

export interface AwsConfigLoaderOptions {
  /** Joins the vault.* dots into the secret name; '-' keeps parity with Azure, '/' fits AWS paths */
  separator?: string
  /**
   * Namespace prepended as `${prefix}/<name>` (Secrets Manager shares one namespace per
   * account+region, unlike one-vault-per-env Azure). Defaults to AWS_SECRETS_PREFIX,
   * the AWS mirror of AZURE_KEYVAULT_URL: the "where" comes from the environment.
   */
  prefix?: string
}

/**
 * AWS mirror of the config-azure seam: resolves `vault.*` placeholders of the app's raw
 * config against Secrets Manager. Same key property: local/test configs carry no
 * placeholders, so AWS is never touched and no credentials are needed.
 */
export async function resolveAwsConfig<T>(
  rawConfig: T,
  client?: AwsSecretsReader,
  options: AwsConfigLoaderOptions = {}
): Promise<T> {
  if (!containsVaultReferences(rawConfig)) {
    return rawConfig
  }

  const reader = client ?? createSecretsManagerClient()
  const prefix = options.prefix ?? process.env['AWS_SECRETS_PREFIX']
  return resolvePlaceholders(rawConfig, name => getSecretValue(prefix ? `${prefix}/${name}` : name, reader), options)
}

/** Region/credentials resolve from the standard AWS environment (12-factor). */
export function createSecretsManagerClient(): SecretsManagerClient {
  return new SecretsManagerClient({})
}

async function getSecretValue(secretName: string, client: AwsSecretsReader): Promise<string | undefined> {
  try {
    const result = await client.send(new GetSecretValueCommand({ SecretId: secretName }))
    return result.SecretString
  } catch (error) {
    throw new AwsSecretsError(`Failed to fetch secret [${secretName}] from AWS Secrets Manager`, error)
  }
}
