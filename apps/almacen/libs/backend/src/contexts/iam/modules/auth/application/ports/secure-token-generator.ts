export interface GeneratedToken {
  /** Opaque value handed to the client/email. Never persisted in clear. */
  value: string
  /** SHA-256 hex of the value, persisted for lookup. */
  hash: string
}

export abstract class SecureTokenGenerator {
  abstract generate(): GeneratedToken
  /** Hash an incoming opaque value the same way, to look it up. */
  abstract hash(value: string): string
}
