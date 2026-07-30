import { SecretsPort } from '@acc/infra/ports'

/** Structural fetch contract so tests inject a fake without hitting the network. */
export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> }
) => Promise<{
  ok: boolean
  status: number
  json(): Promise<unknown>
}>

export interface DopplerSecretsOptions {
  /** Doppler service token (scoped to a project+config); free tier friendly */
  token: string
  baseUrl?: string
}

/**
 * Doppler adapter for the SecretsPort (free-tier secret manager for non-Azure stacks,
 * e.g. Cloudflare deployments). Reads a single secret via the REST API.
 */
export class DopplerSecrets extends SecretsPort {
  private readonly baseUrl: string

  constructor(
    private readonly options: DopplerSecretsOptions,
    private readonly fetchFn: FetchLike = fetch as unknown as FetchLike
  ) {
    super()
    this.baseUrl = options.baseUrl ?? 'https://api.doppler.com/v3'
  }

  async get(name: string): Promise<string | null> {
    const response = await this.fetchFn(`${this.baseUrl}/configs/config/secret?name=${encodeURIComponent(name)}`, {
      headers: { Authorization: `Bearer ${this.options.token}`, Accept: 'application/json' }
    })

    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Doppler secret lookup for [${name}] failed with status ${response.status}`)

    const body = (await response.json()) as { value?: { computed?: string } }
    return body.value?.computed ?? null
  }
}
