import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { containsVaultReferences, resolvePlaceholders } from '@raptor/infra-ports'

export class GcpSecretsError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown
  ) {
    super(message)
    this.name = 'GcpSecretsError'
  }
}

/**
 * Minimal structural contract over the Secret Manager client, so tests inject a fake
 * without the SDK (same pattern as AwsSecretsReader in config-aws). The real client
 * returns a longer tuple; the factory below adapts it to this one-element shape.
 */
export interface GcpSecretsReader {
  getProjectId(): Promise<string>
  accessSecretVersion(request: { name: string }): Promise<[{ payload?: { data?: Uint8Array | string | null } | null }]>
}

export interface GcpConfigLoaderOptions {
  /** Joins the vault.* dots into the secret id; '-' matches the `${name}-typeorm-*` ids of secret-manager.tf */
  separator?: string
  /**
   * Namespace prepended as `${prefix}-<name>` (Secret Manager shares one namespace per
   * project). Defaults to GCP_SECRETS_PREFIX, the env var cloud-run.tf injects: the
   * "where" comes from the environment.
   */
  prefix?: string
}

/**
 * GCP mirror of the config-azure/aws seam: resolves `vault.*` placeholders of the app's
 * raw config against Secret Manager. Same key property: local/test configs carry no
 * placeholders, so GCP is never touched and no credentials are needed.
 */
export async function resolveGcpConfig<T>(
  rawConfig: T,
  client?: GcpSecretsReader,
  options: GcpConfigLoaderOptions = {}
): Promise<T> {
  if (!containsVaultReferences(rawConfig)) {
    return rawConfig
  }

  const reader = client ?? createSecretManagerReader()
  const prefix = options.prefix ?? process.env['GCP_SECRETS_PREFIX']
  return resolvePlaceholders(rawConfig, name => getSecretValue(prefix ? `${prefix}-${name}` : name, reader), options)
}

/** Project/credentials resolve from Application Default Credentials (12-factor). */
export function createSecretManagerReader(): GcpSecretsReader {
  const client = new SecretManagerServiceClient()
  return {
    getProjectId: () => client.getProjectId(),
    accessSecretVersion: async request => {
      const [response] = await client.accessSecretVersion(request)
      return [response ?? {}]
    }
  }
}

async function getSecretValue(secretId: string, client: GcpSecretsReader): Promise<string | undefined> {
  try {
    const projectId = await client.getProjectId()
    const [response] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretId}/versions/latest`
    })
    const data = response.payload?.data
    if (data == null) {
      return undefined
    }
    return typeof data === 'string' ? data : Buffer.from(data).toString('utf-8')
  } catch (error) {
    throw new GcpSecretsError(`Failed to fetch secret [${secretId}] from GCP Secret Manager`, error)
  }
}
