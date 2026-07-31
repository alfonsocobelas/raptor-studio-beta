import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { AwsSecretsReader, resolveAwsConfig } from './aws-config-loader'

const fakeReader = (secrets: Record<string, string>): AwsSecretsReader & { send: jest.Mock } => ({
  send: jest.fn(async (command: GetSecretValueCommand) => {
    const name = command.input.SecretId as string
    if (!(name in secrets)) throw Object.assign(new Error('missing'), { name: 'ResourceNotFoundException' })
    return { SecretString: secrets[name] }
  })
})

describe('resolveAwsConfig', () => {
  it('returns the config untouched (never builds a client) without placeholders', async () => {
    const raw = { env: 'local', typeorm: { host: 'localhost' } }

    await expect(resolveAwsConfig(raw)).resolves.toBe(raw)
  })

  it('resolves vault.* placeholders with the dashes convention by default', async () => {
    const reader = fakeReader({ 'typeorm-host': 'db.aws.example' })

    const resolved = await resolveAwsConfig({ typeorm: { host: 'vault.typeorm.host', port: 5432 } }, reader)

    expect(resolved).toEqual({ typeorm: { host: 'db.aws.example', port: 5432 } })
  })

  it('supports the slash separator for AWS-style secret paths', async () => {
    const reader = fakeReader({ 'typeorm/host': 'db.aws.example' })

    const resolved = await resolveAwsConfig({ host: 'vault.typeorm.host' }, reader, { separator: '/' })

    expect(resolved).toEqual({ host: 'db.aws.example' })
  })

  it('namespaces the secret name with the prefix option', async () => {
    const reader = fakeReader({ 'boutique-prod/typeorm-host': 'db.aws.example' })

    const resolved = await resolveAwsConfig({ host: 'vault.typeorm.host' }, reader, { prefix: 'boutique-prod' })

    expect(resolved).toEqual({ host: 'db.aws.example' })
  })

  it('defaults the prefix from AWS_SECRETS_PREFIX (12-factor, mirrors AZURE_KEYVAULT_URL)', async () => {
    process.env['AWS_SECRETS_PREFIX'] = 'boutique-prod'
    try {
      const reader = fakeReader({ 'boutique-prod/typeorm-host': 'db.aws.example' })

      const resolved = await resolveAwsConfig({ host: 'vault.typeorm.host' }, reader)

      expect(resolved).toEqual({ host: 'db.aws.example' })
    } finally {
      delete process.env['AWS_SECRETS_PREFIX']
    }
  })

  it('wraps lookup failures in AwsSecretsError', async () => {
    await expect(resolveAwsConfig({ a: 'vault.missing.secret' }, fakeReader({}))).rejects.toMatchObject({
      name: 'AwsSecretsError'
    })
  })
})
