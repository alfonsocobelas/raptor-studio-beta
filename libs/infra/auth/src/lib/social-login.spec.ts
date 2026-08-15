import { Clock } from '@raptor/infra-ports'
import { GithubLoginProvider } from './github-login-provider'
import { GoogleOidcProvider } from './google-oidc-provider'
import { MicrosoftOidcProvider } from './microsoft-oidc-provider'
import { OidcFetchLike } from './oidc-code-flow-provider'

const b64url = (obj: unknown): string => Buffer.from(JSON.stringify(obj)).toString('base64url')
const idToken = (claims: Record<string, unknown>): string =>
  `${b64url({ alg: 'RS256' })}.${b64url(claims)}.firma`

class FixedClock extends Clock {
  now(): Date {
    return new Date('2026-07-30T10:00:00.000Z')
  }
}

const googleClaims = {
  iss: 'https://accounts.google.com',
  aud: 'client-1',
  sub: 'g-123',
  email: 'alfonso@example.com',
  email_verified: true,
  name: 'Alfonso',
  exp: 1785500000,
  nonce: 'n-1'
}

const tokenResponse = (token: string): ReturnType<OidcFetchLike> =>
  Promise.resolve({ ok: true, status: 200, json: async () => ({ id_token: token }) })

describe('GoogleOidcProvider', () => {
  const provider = (fetchFn: OidcFetchLike) =>
    new GoogleOidcProvider({ clientId: 'client-1', clientSecret: 's3cret' }, fetchFn, new FixedClock())

  it('builds the authorization url with state and nonce', () => {
    const url = provider(jest.fn()).authorizationUrl({ redirectUri: 'https://app/cb', state: 'st-1', nonce: 'n-1' })
    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth?')
    expect(url).toContain('client_id=client-1')
    expect(url).toContain('state=st-1')
    expect(url).toContain('nonce=n-1')
    expect(url).toContain('scope=openid+email+profile')
  })

  it('exchanges the code and validates iss/aud/exp/nonce', async () => {
    const fetchFn = jest.fn(() => tokenResponse(idToken(googleClaims)))
    const identity = await provider(fetchFn).exchangeCode({ code: 'c-1', redirectUri: 'https://app/cb', nonce: 'n-1' })

    expect(identity).toEqual({
      provider: 'google',
      subject: 'g-123',
      email: 'alfonso@example.com',
      emailVerified: true,
      name: 'Alfonso'
    })
  })

  it('rejects a token with wrong audience, wrong issuer, expired or nonce mismatch', async () => {
    for (const bad of [
      { ...googleClaims, aud: 'otro' },
      { ...googleClaims, iss: 'https://evil.example' },
      { ...googleClaims, exp: 1000 },
      { ...googleClaims, nonce: 'otro' }
    ]) {
      const fetchFn = jest.fn(() => tokenResponse(idToken(bad)))
      await expect(
        provider(fetchFn).exchangeCode({ code: 'c', redirectUri: 'https://app/cb', nonce: 'n-1' })
      ).rejects.toThrow()
    }
  })
})

describe('MicrosoftOidcProvider', () => {
  it('scopes endpoints and issuer to the tenant', async () => {
    const claims = {
      ...googleClaims,
      iss: 'https://login.microsoftonline.com/tenant-guid/v2.0',
      sub: 'ms-1'
    }
    const fetchFn = jest.fn(() => tokenResponse(idToken(claims)))
    const provider = new MicrosoftOidcProvider(
      { clientId: 'client-1', clientSecret: 's3cret', tenant: 'tenant-guid' },
      fetchFn,
      new FixedClock()
    )

    expect(provider.authorizationUrl({ redirectUri: 'https://app/cb', state: 's' })).toContain(
      'https://login.microsoftonline.com/tenant-guid/oauth2/v2.0/authorize?'
    )

    const identity = await provider.exchangeCode({ code: 'c', redirectUri: 'https://app/cb', nonce: 'n-1' })
    expect(identity.provider).toBe('microsoft')
    expect(identity.subject).toBe('ms-1')
  })
})

describe('GithubLoginProvider', () => {
  it('exchanges the code and reads the primary verified email', async () => {
    const fetchFn = jest.fn((url: string) => {
      if (url.includes('login/oauth/access_token')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ access_token: 'gh-token' }) })
      }
      if (url.endsWith('/user')) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 99, name: 'Alfonso', email: null }) })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => [{ email: 'alfonso@example.com', primary: true, verified: true }]
      })
    })
    const provider = new GithubLoginProvider({ clientId: 'client-1', clientSecret: 's3cret' }, fetchFn)

    expect(provider.authorizationUrl({ redirectUri: 'https://app/cb', state: 'st' })).toContain(
      'https://github.com/login/oauth/authorize?'
    )

    const identity = await provider.exchangeCode({ code: 'c', redirectUri: 'https://app/cb' })
    expect(identity).toEqual({
      provider: 'github',
      subject: '99',
      email: 'alfonso@example.com',
      emailVerified: true,
      name: 'Alfonso'
    })
  })
})
