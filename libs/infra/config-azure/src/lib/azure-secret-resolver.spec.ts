import { containsVaultReferences, resolveSecrets, SecretReader } from './azure-secret-resolver'
import { resolveAzureConfig } from './azure-config-loader'

const fakeReader = (secrets: Record<string, string>): SecretReader => ({
  getSecret: jest.fn(async (name: string) => {
    if (!(name in secrets)) throw { statusCode: 404 }
    return { value: secrets[name] }
  })
})

describe('containsVaultReferences', () => {
  it('detects placeholders at any nesting level', () => {
    expect(containsVaultReferences({ typeorm: { host: 'vault.typeorm.host' } })).toBe(true)
    expect(containsVaultReferences(['a', { b: 'vault.x' }])).toBe(true)
  })

  it('returns false for plain configs (local/test never touch Azure)', () => {
    expect(containsVaultReferences({ typeorm: { host: 'localhost', port: 5433 } })).toBe(false)
  })
})

describe('resolveSecrets', () => {
  it('replaces vault.* placeholders using the dots-to-dashes secret naming', async () => {
    const reader = fakeReader({ 'typeorm-host': 'db.example.com' })

    const resolved = await resolveSecrets({ typeorm: { host: 'vault.typeorm.host', port: 5432 } }, reader)

    expect(resolved).toEqual({ typeorm: { host: 'db.example.com', port: 5432 } })
    expect(reader.getSecret).toHaveBeenCalledWith('typeorm-host')
  })

  it('wraps lookup failures in AzureKeyVaultError with the status code', async () => {
    const reader = fakeReader({})

    await expect(resolveSecrets({ a: 'vault.missing.secret' }, reader)).rejects.toMatchObject({
      name: 'AzureKeyVaultError',
      statusCode: 404
    })
  })
})

describe('resolveAzureConfig', () => {
  it('returns the config untouched (and never builds a client) when there are no placeholders', async () => {
    const raw = { env: 'local', typeorm: { host: 'localhost' } }

    await expect(resolveAzureConfig(raw)).resolves.toBe(raw)
  })

  it('resolves placeholders through the injected reader', async () => {
    const reader = fakeReader({ 'acs-connection-string': 'endpoint=sb://acs' })

    const resolved = await resolveAzureConfig({ acs: { connectionString: 'vault.acs.connection-string' } }, reader)

    expect(resolved).toEqual({ acs: { connectionString: 'endpoint=sb://acs' } })
  })
})
