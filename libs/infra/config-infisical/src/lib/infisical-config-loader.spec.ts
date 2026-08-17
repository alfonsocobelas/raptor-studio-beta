import { InfisicalSecretsReader, resolveInfisicalConfig } from './infisical-config-loader'

const fakeReader = (secrets: Record<string, string>): InfisicalSecretsReader & { fetchSecret: jest.Mock } => ({
  fetchSecret: jest.fn(async (name: string) => secrets[name])
})

describe('resolveInfisicalConfig', () => {
  it('returns the config untouched (never logs in) without placeholders', async () => {
    const raw = { env: 'local', typeorm: { host: 'localhost' } }

    await expect(resolveInfisicalConfig(raw)).resolves.toBe(raw)
  })

  it('resolves vault.* placeholders against the SCREAMING_SNAKE convention of Infisical', async () => {
    const reader = fakeReader({ TYPEORM_PASSWORD: 's3cr3t' })

    const resolved = await resolveInfisicalConfig({ typeorm: { password: 'vault.typeorm.password', port: 5432 } }, reader)

    expect(resolved).toEqual({ typeorm: { password: 's3cr3t', port: 5432 } })
    expect(reader.fetchSecret).toHaveBeenCalledWith('TYPEORM_PASSWORD')
  })

  it('resolves every placeholder of a nested config, leaving the rest untouched', async () => {
    const reader = fakeReader({ TYPEORM_PASSWORD: 's3cr3t', STORAGE_SECRETACCESSKEY: 'r2-key', LOKI_APIKEY: 'glc_x' })

    const resolved = await resolveInfisicalConfig(
      {
        typeorm: { host: 'db.internal', password: 'vault.typeorm.password' },
        storage: { bucket: 'files', secretAccessKey: 'vault.storage.secretAccessKey' },
        loki: { url: 'https://logs.example', apiKey: 'vault.loki.apiKey' }
      },
      reader
    )

    expect(resolved).toEqual({
      typeorm: { host: 'db.internal', password: 's3cr3t' },
      storage: { bucket: 'files', secretAccessKey: 'r2-key' },
      loki: { url: 'https://logs.example', apiKey: 'glc_x' }
    })
  })

  it('wraps a missing secret in InfisicalSecretsError naming the secret', async () => {
    await expect(resolveInfisicalConfig({ a: 'vault.missing.secret' }, fakeReader({}))).rejects.toMatchObject({
      name: 'InfisicalSecretsError',
      message: expect.stringContaining('MISSING_SECRET')
    })
  })

  it('wraps reader failures in InfisicalSecretsError keeping the cause', async () => {
    const boom = new Error('ECONNREFUSED')
    const reader: InfisicalSecretsReader = {
      fetchSecret: async () => {
        throw boom
      }
    }

    await expect(resolveInfisicalConfig({ a: 'vault.typeorm.password' }, reader)).rejects.toMatchObject({
      name: 'InfisicalSecretsError',
      cause: boom
    })
  })
})
