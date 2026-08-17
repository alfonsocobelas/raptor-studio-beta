import { createInfisicalReader, InfisicalFetch } from './infisical-secret-resolver'

const json = (body: unknown, status = 200): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response

/** Records every call so the tests can assert the two-step protocol without a server. */
const fakeFetch = (
  handler: (url: string, init?: RequestInit) => Response
): InfisicalFetch & { calls: { url: string; init?: RequestInit }[] } => {
  const calls: { url: string; init?: RequestInit }[] = []
  const fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return handler(url, init)
  }) as InfisicalFetch & { calls: typeof calls }
  fetch.calls = calls
  return fetch
}

const options = {
  siteUrl: 'https://infisical.example',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  projectId: 'project-id',
  environment: 'prod'
}

const happyPath = (secrets: Record<string, string>) =>
  fakeFetch(url => {
    if (url.endsWith('/api/v1/auth/universal-auth/login')) {
      return json({ accessToken: 'token-123' })
    }
    const name = new URL(url).pathname.split('/').pop() as string
    return name in secrets ? json({ secret: { secretValue: secrets[name] } }) : json({ message: 'not found' }, 404)
  })

describe('createInfisicalReader', () => {
  it('logs in with the machine identity and reads the secret with the issued token', async () => {
    const fetch = happyPath({ TYPEORM_PASSWORD: 's3cr3t' })

    const value = await createInfisicalReader({ ...options, fetch }).fetchSecret('TYPEORM_PASSWORD')

    expect(value).toBe('s3cr3t')
    expect(fetch.calls[0].url).toBe('https://infisical.example/api/v1/auth/universal-auth/login')
    expect(JSON.parse(String(fetch.calls[0].init?.body))).toEqual({
      clientId: 'client-id',
      clientSecret: 'client-secret'
    })
    expect(fetch.calls[1].url).toContain('/api/v3/secrets/raw/TYPEORM_PASSWORD')
    expect(fetch.calls[1].url).toContain('workspaceId=project-id')
    expect(fetch.calls[1].url).toContain('environment=prod')
    expect((fetch.calls[1].init?.headers as Record<string, string>)['Authorization']).toBe('Bearer token-123')
  })

  it('logs in once and reuses the token for later secrets', async () => {
    const fetch = happyPath({ A: '1', B: '2' })
    const reader = createInfisicalReader({ ...options, fetch })

    await reader.fetchSecret('A')
    await reader.fetchSecret('B')

    expect(fetch.calls.filter(call => call.url.includes('/login'))).toHaveLength(1)
  })

  it('returns undefined for a secret that does not exist', async () => {
    const fetch = happyPath({})

    await expect(createInfisicalReader({ ...options, fetch }).fetchSecret('NOPE')).resolves.toBeUndefined()
  })

  it('throws without leaking the client secret when the login is rejected', async () => {
    const fetch = fakeFetch(() => json({ message: 'invalid credentials' }, 401))

    const failure = await createInfisicalReader({ ...options, fetch })
      .fetchSecret('TYPEORM_PASSWORD')
      .catch((error: Error) => error)

    expect((failure as Error).message).toContain('401')
    expect(JSON.stringify(failure)).not.toContain('client-secret')
  })

  it('defaults site url and reads the identity from the environment (12-factor)', async () => {
    process.env['INFISICAL_CLIENT_ID'] = 'env-client'
    process.env['INFISICAL_CLIENT_SECRET'] = 'env-secret'
    process.env['INFISICAL_PROJECT_ID'] = 'env-project'
    process.env['INFISICAL_ENV'] = 'staging'
    try {
      const fetch = happyPath({ TYPEORM_PASSWORD: 's3cr3t' })

      const value = await createInfisicalReader({ fetch }).fetchSecret('TYPEORM_PASSWORD')

      expect(value).toBe('s3cr3t')
      expect(fetch.calls[0].url).toBe('https://app.infisical.com/api/v1/auth/universal-auth/login')
      expect(fetch.calls[1].url).toContain('environment=staging')
    } finally {
      delete process.env['INFISICAL_CLIENT_ID']
      delete process.env['INFISICAL_CLIENT_SECRET']
      delete process.env['INFISICAL_PROJECT_ID']
      delete process.env['INFISICAL_ENV']
    }
  })

  it('refuses to call Infisical without a machine identity configured', async () => {
    const fetch = happyPath({})

    await expect(createInfisicalReader({ siteUrl: 'https://infisical.example', fetch }).fetchSecret('A')).rejects.toThrow(
      /INFISICAL_CLIENT_ID/
    )
  })
})
