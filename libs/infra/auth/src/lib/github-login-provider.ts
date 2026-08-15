import { SocialIdentity, SocialLoginProvider } from '@raptor/infra-ports'
import { OidcFetchLike } from './oidc-code-flow-provider'

export interface GithubLoginOptions {
  clientId: string
  clientSecret: string
}

interface GithubUser {
  id: number
  name: string | null
  email: string | null
}

interface GithubEmail {
  email: string
  primary: boolean
  verified: boolean
}

/**
 * GitHub no es OIDC (OAuth2 plano, sin id_token): la identidad se lee de la API
 * con el access token recién intercambiado. El email puede ser privado: se
 * resuelve contra /user/emails (primary + verified).
 */
export class GithubLoginProvider extends SocialLoginProvider {
  readonly name = 'github'

  constructor(
    private readonly options: GithubLoginOptions,
    private readonly fetchFn: OidcFetchLike = fetch as unknown as OidcFetchLike
  ) {
    super()
  }

  authorizationUrl(input: { redirectUri: string; state: string }): string {
    const params = new URLSearchParams({
      client_id: this.options.clientId,
      redirect_uri: input.redirectUri,
      scope: 'read:user user:email',
      state: input.state
    })

    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  async exchangeCode(input: { code: string; redirectUri: string }): Promise<SocialIdentity> {
    const tokenResponse = await this.fetchFn('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        code: input.code,
        redirect_uri: input.redirectUri
      }).toString()
    })

    if (!tokenResponse.ok) {
      throw new Error(`github token exchange failed with status ${tokenResponse.status}`)
    }

    const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string }
    if (!accessToken) {
      throw new Error('github token response carries no access_token')
    }

    const user = (await this.getJson('https://api.github.com/user', accessToken)) as GithubUser
    const primary = user.email ? null : await this.primaryEmail(accessToken)

    return {
      provider: this.name,
      subject: String(user.id),
      email: primary?.email ?? user.email,
      emailVerified: primary?.verified ?? false,
      name: user.name
    }
  }

  private async primaryEmail(accessToken: string): Promise<GithubEmail | null> {
    const emails = (await this.getJson('https://api.github.com/user/emails', accessToken)) as GithubEmail[]
    return emails.find(e => e.primary && e.verified) ?? emails.find(e => e.verified) ?? null
  }

  private async getJson(url: string, accessToken: string): Promise<unknown> {
    const response = await this.fetchFn(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' }
    })

    if (!response.ok) {
      throw new Error(`github api call to ${url} failed with status ${response.status}`)
    }

    return response.json()
  }
}
