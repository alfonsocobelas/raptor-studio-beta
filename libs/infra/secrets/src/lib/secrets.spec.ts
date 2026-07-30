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
