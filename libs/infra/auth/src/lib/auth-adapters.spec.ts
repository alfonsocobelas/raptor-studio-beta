import { Argon2PasswordHasher } from './argon2-password-hasher'
import { CryptoSecureTokenGenerator } from './crypto-secure-token-generator'
import { InMemorySessionStore } from './in-memory-session-store'

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher()

  it('hashes with argon2id and verifies the round trip', async () => {
    const hash = await hasher.hash('s3cret!')

    expect(hash).toContain('$argon2id$')
    expect(await hasher.verify(hash, 's3cret!')).toBe(true)
    expect(await hasher.verify(hash, 'wrong')).toBe(false)
  })

  it('returns false (never throws) on malformed hashes', async () => {
    expect(await hasher.verify('not-a-hash', 'x')).toBe(false)
  })
})

describe('CryptoSecureTokenGenerator', () => {
  it('generates base64url tokens whose stored hash is the sha256 of the value', () => {
    const generator = new CryptoSecureTokenGenerator()

    const token = generator.generate()

    expect(token.value).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.hash).toBe(generator.hash(token.value))
    expect(token.hash).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('InMemorySessionStore', () => {
  it('expires records on read', async () => {
    const store = new InMemorySessionStore()
    await store.save({
      id: 's',
      userId: 'u',
      tokenHash: 'h',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      lastSeenAt: new Date().toISOString()
    })

    expect(await store.findByTokenHash('h')).toBeNull()
  })
})
