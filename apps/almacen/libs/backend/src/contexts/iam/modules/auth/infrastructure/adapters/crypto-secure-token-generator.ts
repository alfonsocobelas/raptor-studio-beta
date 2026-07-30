import { Injectable } from '@nestjs/common'
import { createHash, randomBytes } from 'crypto'
import { AUTH_POLICY } from '../../domain/auth-constants'
import { GeneratedToken, SecureTokenGenerator } from '../../application/ports/secure-token-generator'

@Injectable()
export class CryptoSecureTokenGenerator extends SecureTokenGenerator {
  generate(): GeneratedToken {
    const value = randomBytes(AUTH_POLICY.SESSION_TOKEN_BYTES).toString('base64url')
    return { value, hash: this.hash(value) }
  }

  hash(value: string): string {
    return createHash('sha256').update(value).digest('hex')
  }
}
