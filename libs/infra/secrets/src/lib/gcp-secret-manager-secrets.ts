import { SecretsPort } from '@raptor/infra-ports'

/**
 * Minimal structural contract over the GCP client (SecretManagerServiceClient satisfies
 * it), so tests inject a fake without the SDK — same pattern as the other adapters.
 */
export interface GcpSecretsReader {
  accessSecretVersion(request: { name: string }): Promise<[{ payload?: { data?: Uint8Array | string | null } | null }]>
}

export interface GcpSecretManagerOptions {
  projectId: string
}

/** GCP Secret Manager adapter for the SecretsPort (missing secret → null). */
export class GcpSecretManagerSecrets extends SecretsPort {
  constructor(
    private readonly options: GcpSecretManagerOptions,
    private readonly client: GcpSecretsReader
  ) {
    super()
  }

  async get(name: string): Promise<string | null> {
    try {
      const [version] = await this.client.accessSecretVersion({
        name: `projects/${this.options.projectId}/secrets/${name}/versions/latest`
      })
      const data = version.payload?.data
      if (data == null) return null
      return typeof data === 'string' ? data : Buffer.from(data).toString('utf8')
    } catch (error) {
      if ((error as { code?: number })?.code === 5) return null // gRPC NOT_FOUND
      throw error
    }
  }
}
