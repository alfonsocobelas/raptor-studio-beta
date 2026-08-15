import { Clock, Nullable, SocialIdentity, SocialLoginProvider } from '@raptor/infra-ports'
import { SystemClock } from './system-clock'

/** Contrato estructural de fetch (mismo patrón que Doppler/Infisical): tests sin red. */
export type OidcFetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string }
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>

export interface OidcCodeFlowOptions {
  clientId: string
  clientSecret: string
}

interface OidcEndpoints {
  name: string
  authorizationEndpoint: string
  tokenEndpoint: string
  scopes: string
  /** Validación del emisor del id_token (por valor exacto o patrón por tenant). */
  isTrustedIssuer(iss: string): boolean
}

interface IdTokenClaims {
  iss?: string
  aud?: string | string[]
  sub?: string
  exp?: number
  nonce?: string
  email?: string
  email_verified?: boolean
  name?: string
}

/**
 * Base OIDC authorization-code flow para confidential clients, sin SDKs.
 * El id_token llega por comunicación directa cliente↔token endpoint sobre TLS,
 * así que la validación de emisor descansa en el TLS del endpoint (OIDC Core
 * §3.1.3.7.6); aquí se validan además iss/aud/exp/nonce. Nunca usar estos
 * adapters con tokens recibidos del navegador (flujo implícito): ahí SÍ hace
 * falta verificar la firma contra JWKS.
 */
export abstract class OidcCodeFlowProvider extends SocialLoginProvider {
  protected constructor(
    private readonly endpoints: OidcEndpoints,
    private readonly options: OidcCodeFlowOptions,
    private readonly fetchFn: OidcFetchLike = fetch as unknown as OidcFetchLike,
    private readonly clock: Clock = new SystemClock()
  ) {
    super()
  }

  get name(): string {
    return this.endpoints.name
  }

  authorizationUrl(input: { redirectUri: string; state: string; nonce?: string }): string {
    const params = new URLSearchParams({
      client_id: this.options.clientId,
      redirect_uri: input.redirectUri,
      response_type: 'code',
      scope: this.endpoints.scopes,
      state: input.state
    })
    if (input.nonce) params.set('nonce', input.nonce)

    return `${this.endpoints.authorizationEndpoint}?${params.toString()}`
  }

  async exchangeCode(input: { code: string; redirectUri: string; nonce?: string }): Promise<SocialIdentity> {
    const response = await this.fetchFn(this.endpoints.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: input.code,
        redirect_uri: input.redirectUri,
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret
      }).toString()
    })

    if (!response.ok) {
      throw new Error(`${this.name} token exchange failed with status ${response.status}`)
    }

    const body = (await response.json()) as { id_token?: string }
    if (!body.id_token) {
      throw new Error(`${this.name} token response carries no id_token`)
    }

    const claims = decodeJwtPayload(body.id_token)
    this.assertValidClaims(claims, input.nonce)

    return {
      provider: this.name,
      subject: claims.sub as string,
      email: claims.email ?? null,
      emailVerified: claims.email_verified === true,
      name: claims.name ?? null
    }
  }

  private assertValidClaims(claims: IdTokenClaims, nonce: Nullable<string> | undefined): void {
    if (!claims.iss || !this.endpoints.isTrustedIssuer(claims.iss)) {
      throw new Error(`${this.name} id_token issuer is not trusted: ${claims.iss ?? 'missing'}`)
    }
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    if (!audiences.includes(this.options.clientId)) {
      throw new Error(`${this.name} id_token audience mismatch`)
    }
    if (!claims.exp || claims.exp * 1000 <= this.clock.now().getTime()) {
      throw new Error(`${this.name} id_token is expired`)
    }
    if (nonce && claims.nonce !== nonce) {
      throw new Error(`${this.name} id_token nonce mismatch`)
    }
    if (!claims.sub) {
      throw new Error(`${this.name} id_token carries no subject`)
    }
  }
}

function decodeJwtPayload(token: string): IdTokenClaims {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Malformed id_token')
  }

  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8')) as IdTokenClaims
}
