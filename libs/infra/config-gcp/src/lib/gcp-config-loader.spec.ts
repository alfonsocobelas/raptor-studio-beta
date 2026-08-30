import { GcpSecretsReader, resolveGcpConfig } from './gcp-config-loader'

const fakeReader = (secrets: Record<string, string | Uint8Array>): GcpSecretsReader & { calls: string[] } => {
  const calls: string[] = []
  return {
    calls,
    getProjectId: async () => 'demo-project',
    accessSecretVersion: async ({ name }) => {
      calls.push(name)
      const secretId = name.replace(/^projects\/demo-project\/secrets\//, '').replace(/\/versions\/latest$/, '')
      if (!(secretId in secrets)) throw Object.assign(new Error('missing'), { code: 5 })
      return [{ payload: { data: secrets[secretId] } }]
    }
  }
}

describe('resolveGcpConfig', () => {
  it('returns the config untouched (never builds a client) without placeholders', async () => {
    const raw = { env: 'local', typeorm: { host: 'localhost' } }

    await expect(resolveGcpConfig(raw)).resolves.toBe(raw)
  })

  it('resolves vault.* placeholders against the full Secret Manager resource name', async () => {
    const reader = fakeReader({ 'typeorm-host': 'db.gcp.example' })

    const resolved = await resolveGcpConfig({ typeorm: { host: 'vault.typeorm.host', port: 5432 } }, reader)

    expect(resolved).toEqual({ typeorm: { host: 'db.gcp.example', port: 5432 } })
    expect(reader.calls).toEqual(['projects/demo-project/secrets/typeorm-host/versions/latest'])
  })

  it('namespaces the secret id with the prefix option (dash, the convention secret-manager.tf uses)', async () => {
    const reader = fakeReader({ 'boutique-prod-typeorm-host': 'db.gcp.example' })

    const resolved = await resolveGcpConfig({ host: 'vault.typeorm.host' }, reader, { prefix: 'boutique-prod' })

    expect(resolved).toEqual({ host: 'db.gcp.example' })
  })

  it('defaults the prefix from GCP_SECRETS_PREFIX (12-factor, the env var cloud-run.tf injects)', async () => {
    process.env['GCP_SECRETS_PREFIX'] = 'boutique-prod'
    try {
      const reader = fakeReader({ 'boutique-prod-typeorm-host': 'db.gcp.example' })

      const resolved = await resolveGcpConfig({ host: 'vault.typeorm.host' }, reader)

      expect(resolved).toEqual({ host: 'db.gcp.example' })
    } finally {
      delete process.env['GCP_SECRETS_PREFIX']
    }
  })

  it('decodes Uint8Array payloads (the wire format of Secret Manager)', async () => {
    const reader = fakeReader({ 'typeorm-host': new TextEncoder().encode('db.gcp.example') })

    const resolved = await resolveGcpConfig({ host: 'vault.typeorm.host' }, reader)

    expect(resolved).toEqual({ host: 'db.gcp.example' })
  })

  it('wraps lookup failures in GcpSecretsError', async () => {
    await expect(resolveGcpConfig({ a: 'vault.missing.secret' }, fakeReader({}))).rejects.toMatchObject({
      name: 'GcpSecretsError'
    })
  })
})
