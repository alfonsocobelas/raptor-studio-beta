import { AzureKeyVaultSecrets } from './azure-key-vault-secrets'
import { DopplerSecrets, FetchLike } from './doppler-secrets'

describe('AzureKeyVaultSecrets', () => {
  it('returns the secret value', async () => {
    const secrets = new AzureKeyVaultSecrets({ getSecret: async () => ({ value: 's3cret' }) })

    expect(await secrets.get('typeorm-host')).toBe('s3cret')
  })

  it('maps 404 to null and rethrows other errors', async () => {
    const missing = new AzureKeyVaultSecrets({
      getSecret: async () => {
        throw { statusCode: 404 }
      }
    })
    const broken = new AzureKeyVaultSecrets({
      getSecret: async () => {
        throw { statusCode: 500 }
      }
    })

    expect(await missing.get('nope')).toBeNull()
    await expect(broken.get('boom')).rejects.toMatchObject({ statusCode: 500 })
  })
})

describe('DopplerSecrets', () => {
  const fakeFetch = (status: number, body?: unknown): FetchLike =>
    jest.fn(async () => ({ ok: status < 400, status, json: async () => body }))

  it('reads the computed value with the service token', async () => {
    const fetchFn = fakeFetch(200, { value: { computed: 'dppl-value' } })
    const secrets = new DopplerSecrets({ token: 'dp.st.xxx' }, fetchFn)

    expect(await secrets.get('DATABASE_URL')).toBe('dppl-value')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.doppler.com/v3/configs/config/secret?name=DATABASE_URL',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer dp.st.xxx' }) })
    )
  })

  it('maps 404 to null and fails loudly on other errors', async () => {
    expect(await new DopplerSecrets({ token: 't' }, fakeFetch(404)).get('nope')).toBeNull()
    await expect(new DopplerSecrets({ token: 't' }, fakeFetch(500)).get('boom')).rejects.toThrow('status 500')
  })
})

import { InfisicalSecrets } from './infisical-secrets'

describe('InfisicalSecrets', () => {
  const fakeFetch = (status: number, body?: unknown): FetchLike =>
    jest.fn(async () => ({ ok: status < 400, status, json: async () => body }))

  it('reads the raw secret scoped to project and environment', async () => {
    const fetchFn = fakeFetch(200, { secret: { secretValue: 'inf-value' } })
    const secrets = new InfisicalSecrets(
      { token: 'st.xxx', projectId: 'proj-1', environment: 'prod', baseUrl: 'https://infisical.local' },
      fetchFn
    )

    expect(await secrets.get('DATABASE_URL')).toBe('inf-value')
    expect(fetchFn).toHaveBeenCalledWith(
      'https://infisical.local/api/v3/secrets/raw/DATABASE_URL?workspaceId=proj-1&environment=prod&secretPath=%2F',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer st.xxx' }) })
    )
  })

  it('maps 404 to null', async () => {
    const secrets = new InfisicalSecrets({ token: 't', projectId: 'p', environment: 'dev' }, fakeFetch(404))

    expect(await secrets.get('nope')).toBeNull()
  })
})

import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { AwsSecretsManagerSecrets } from './aws-secrets-manager-secrets'

describe('AwsSecretsManagerSecrets', () => {
  it('returns the secret string', async () => {
    const secrets = new AwsSecretsManagerSecrets({
      send: jest.fn(async (c: GetSecretValueCommand) => ({ SecretString: `v:${c.input.SecretId}` }))
    })

    expect(await secrets.get('typeorm-host')).toBe('v:typeorm-host')
  })

  it('maps ResourceNotFoundException to null and rethrows other errors', async () => {
    const missing = new AwsSecretsManagerSecrets({
      send: jest.fn(async () => {
        throw Object.assign(new Error('nope'), { name: 'ResourceNotFoundException' })
      })
    })
    const broken = new AwsSecretsManagerSecrets({
      send: jest.fn(async () => {
        throw Object.assign(new Error('boom'), { name: 'AccessDeniedException' })
      })
    })

    expect(await missing.get('nope')).toBeNull()
    await expect(broken.get('x')).rejects.toThrow('boom')
  })
})
