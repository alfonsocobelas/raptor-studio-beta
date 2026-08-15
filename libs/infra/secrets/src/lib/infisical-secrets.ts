import { SecretsPort } from '@raptor/infra-ports'
import { FetchLike } from './doppler-secrets'

export interface InfisicalSecretsOptions {
  /** Service token or machine identity access token */
  token: string
  projectId: string
  environment: string
  /** Self-hosted URL (free, docker) or Infisical Cloud */
  baseUrl?: string
  secretPath?: string
}

/**
 * Infisical adapter for the SecretsPort — the self-hostable open-source option of the
 * catalog (free path alongside Doppler; Bitwarden Secrets Manager pending, its SDK is
 * native-only). Reads a single secret via the REST API.
 */
export class InfisicalSecrets extends SecretsPort {
  private readonly baseUrl: string

  constructor(
    private readonly options: InfisicalSecretsOptions,
    private readonly fetchFn: FetchLike = fetch as unknown as FetchLike
  ) {
    super()
    this.baseUrl = options.baseUrl ?? 'https://app.infisical.com'
  }

  async get(name: string): Promise<string | null> {
    const params = new URLSearchParams({
      workspaceId: this.options.projectId,
      environment: this.options.environment,
      secretPath: this.options.secretPath ?? '/'
    })
    const response = await this.fetchFn(`${this.baseUrl}/api/v3/secrets/raw/${encodeURIComponent(name)}?${params}`, {
      headers: { Authorization: `Bearer ${this.options.token}`, Accept: 'application/json' }
    })

    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Infisical secret lookup for [${name}] failed with status ${response.status}`)

    const body = (await response.json()) as { secret?: { secretValue?: string } }
    return body.secret?.secretValue ?? null
  }
}
