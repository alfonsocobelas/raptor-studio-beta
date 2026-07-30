import { SecretsPort } from '@acc/infra-ports'

/**
 * Structural contract over the Bitwarden Secrets Manager SDK (@bitwarden/sdk-napi).
 * Secrets Manager is end-to-end encrypted: the REST API alone returns ciphertext,
 * so decryption REQUIRES the native SDK. The client is injected (never a dependency
 * of this lib): construct it in the composition root and pass it in.
 */
export interface BitwardenSecretsClientLike {
  secrets(): {
    list(organizationId: string): Promise<{ data: { id: string; key: string }[] }>
    get(id: string): Promise<{ id: string; key: string; value: string }>
    getByIds(ids: string[]): unknown
  }
}

export interface BitwardenSecretsOptions {
  /** Organization whose Secrets Manager holds the secrets */
  organizationId: string
}

/**
 * Bitwarden Secrets Manager adapter for the SecretsPort. Secrets are addressed
 * by key (their human name), resolved to the internal id via list() — the SDK
 * has no direct get-by-key. The id→key listing is cached per instance: the
 * loaders resolve all vault.* markers in one boot pass.
 */
export class BitwardenSecrets extends SecretsPort {
  private idsByKey: Promise<Map<string, string>> | null = null

  constructor(
    private readonly options: BitwardenSecretsOptions,
    private readonly client: BitwardenSecretsClientLike
  ) {
    super()
  }

  async get(name: string): Promise<string | null> {
    this.idsByKey ??= this.loadIndex()
    const id = (await this.idsByKey).get(name)

    if (!id) return null

    const secret = await this.client.secrets().get(id)
    return secret.value
  }

  private async loadIndex(): Promise<Map<string, string>> {
    const { data } = await this.client.secrets().list(this.options.organizationId)
    return new Map(data.map(entry => [entry.key, entry.id]))
  }
}
