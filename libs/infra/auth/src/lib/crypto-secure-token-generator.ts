import { createHash, randomBytes } from 'crypto'
import { GeneratedToken, SecureTokenGenerator } from '@acc/infra/ports'

/** Session token entropy of the reference AUTH_POLICY; override per app if needed. */
export const DEFAULT_TOKEN_BYTES = 32

export class CryptoSecureTokenGenerator extends SecureTokenGenerator {
  constructor(private readonly tokenBytes: number = DEFAULT_TOKEN_BYTES) {
    super()
  }

  generate(): GeneratedToken {
    const value = randomBytes(this.tokenBytes).toString('base64url')
    return { value, hash: this.hash(value) }
  }

  hash(value: string): string {
    return createHash('sha256').update(value).digest('hex')
  }
}
