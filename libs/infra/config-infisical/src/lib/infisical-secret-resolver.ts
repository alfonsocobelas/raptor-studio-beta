import type { InfisicalSecretsReader } from './infisical-config-loader'
import { InfisicalSecretsError } from './infisical-config-loader'

/** The slice of `fetch` this reader uses; Node 24 ships it globally, so no SDK is needed. */
export type InfisicalFetch = (url: string, init?: RequestInit) => Promise<Response>

export interface InfisicalReaderOptions {
  /** Base URL of the Infisical API. Point it at your own host to self-host later. */
  siteUrl?: string
  clientId?: string
  clientSecret?: string
  projectId?: string
  environment?: string
  fetch?: InfisicalFetch
}

const DEFAULT_SITE_URL = 'https://app.infisical.com'

/**
 * Reads secrets over the Infisical REST API with a machine identity (universal auth).
 * Deliberately no SDK: two HTTP calls and the native fetch keep the "low cost" provider
 * free of extra dependencies and of native binaries that break slim Docker images.
 *
 * The access token lives in memory for the life of the process — never on disk — and one
 * login serves every later secret.
 */
export function createInfisicalReader(options: InfisicalReaderOptions = {}): InfisicalSecretsReader {
  const siteUrl = (options.siteUrl ?? process.env['INFISICAL_SITE_URL'] ?? DEFAULT_SITE_URL).replace(/\/$/, '')
  const clientId = options.clientId ?? process.env['INFISICAL_CLIENT_ID']
  const clientSecret = options.clientSecret ?? process.env['INFISICAL_CLIENT_SECRET']
  const projectId = options.projectId ?? process.env['INFISICAL_PROJECT_ID']
  const environment = options.environment ?? process.env['INFISICAL_ENV'] ?? 'prod'
  const http = options.fetch ?? (globalThis.fetch as InfisicalFetch)

  let token: Promise<string> | undefined

  const login = async (): Promise<string> => {
    if (!clientId || !clientSecret) {
      throw new InfisicalSecretsError('Missing machine identity: set INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET')
    }
    const response = await http(`${siteUrl}/api/v1/auth/universal-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    })
    if (!response.ok) {
      // The status is the whole message on purpose: the body may echo the credentials back.
      throw new InfisicalSecretsError(`Infisical login rejected with status ${response.status}`)
    }
    const body = (await response.json()) as { accessToken?: string }
    if (!body.accessToken) {
      throw new InfisicalSecretsError('Infisical login returned no access token')
    }
    return body.accessToken
  }

  return {
    async fetchSecret(name: string): Promise<string | undefined> {
      if (!clientId || !clientSecret) {
        throw new InfisicalSecretsError('Missing machine identity: set INFISICAL_CLIENT_ID and INFISICAL_CLIENT_SECRET')
      }
      if (!projectId) {
        throw new InfisicalSecretsError('Missing project: set INFISICAL_PROJECT_ID')
      }
      // A failed login must not poison the cache: the next read retries from scratch.
      token ??= login().catch(error => {
        token = undefined
        throw error
      })
      const accessToken = await token

      const query = new URLSearchParams({ workspaceId: projectId, environment })
      const response = await http(`${siteUrl}/api/v3/secrets/raw/${encodeURIComponent(name)}?${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (response.status === 404) {
        return undefined
      }
      if (!response.ok) {
        throw new InfisicalSecretsError(`Infisical rejected the read of ${name} with status ${response.status}`)
      }
      const body = (await response.json()) as { secret?: { secretValue?: string } }
      return body.secret?.secretValue
    }
  }
}
