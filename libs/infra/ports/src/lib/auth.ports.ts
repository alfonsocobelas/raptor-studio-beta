import { Nullable } from './types'

// Auth ports of the catalog (ADR-004), extracted from the reference cookie-session auth
// module (single-tenant). The session store contract works on PRIMITIVES on purpose:
// the domain Session aggregate stays in the generated app; adapters (typeorm, redis,
// in-memory) only persist records, so swapping where sessions live never touches domain.

export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>
  abstract verify(hash: string, plain: string): Promise<boolean>
}

export interface GeneratedToken {
  /** Opaque value handed to the client cookie/email. Never persisted in clear. */
  value: string
  /** SHA-256 hex of the value, persisted for lookup. */
  hash: string
}

export abstract class SecureTokenGenerator {
  abstract generate(): GeneratedToken
  /** Hash an incoming opaque value the same way, to look it up. */
  abstract hash(value: string): string
}

export abstract class Clock {
  abstract now(): Date
}

export interface SessionRecord {
  id: string
  userId: string
  tokenHash: string
  createdAt: string
  expiresAt: string
  lastSeenAt: string
  /** Multi-tenant deployments stamp the owning tenant; single-tenant apps omit it. */
  tenantId?: string
}

/** Framework-free request surface a tenant resolver needs (works for Nest/Express/Fastify). */
export interface TenantRequestContext {
  headers: Record<string, string | string[] | undefined>
  /** Host header ('acme.dashboards.example.com[:port]') when resolving by subdomain. */
  host?: string
}

/**
 * Resolves the tenant of an incoming request. Returns null when the request
 * cannot be attributed to a tenant — callers must reject, NEVER fall back to
 * a default tenant (cross-tenant leakage).
 */
export abstract class TenantResolver {
  abstract resolve(ctx: TenantRequestContext): Nullable<string>
}

export abstract class SessionStore {
  abstract findByTokenHash(tokenHash: string): Promise<Nullable<SessionRecord>>
  /** Upsert; adapters with native TTL (redis) expire the record at expiresAt. */
  abstract save(record: SessionRecord): Promise<void>
  abstract deleteByTokenHash(tokenHash: string): Promise<void>
  abstract deleteAllByUserId(userId: string): Promise<void>
}
