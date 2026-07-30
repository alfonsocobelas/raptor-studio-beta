import { Nullable, SessionRecord, SessionStore } from '@acc/infra-ports'

/**
 * Minimal structural contract over the redis client (ioredis satisfies it), so tests
 * inject a fake without the driver — same pattern as SecretReader in config-azure.
 */
export interface RedisLike {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<unknown>
  expireat(key: string, unixSeconds: number): Promise<unknown>
  del(...keys: string[]): Promise<unknown>
  sadd(key: string, member: string): Promise<unknown>
  srem(key: string, member: string): Promise<unknown>
  smembers(key: string): Promise<string[]>
}

export interface RedisSessionStoreOptions {
  /** Key prefix; defaults to 'session'. Final keys: <prefix>:<tokenHash> and <prefix>:user:<userId> */
  prefix?: string
}

/**
 * Redis adapter for the SessionStore port (single-tenant cookie-session auth): the
 * session record lives in redis with native TTL at expiresAt, and a per-user set
 * indexes token hashes so logout-everywhere (deleteAllByUserId) stays O(sessions).
 */
export class RedisSessionStore extends SessionStore {
  private readonly prefix: string

  constructor(
    private readonly redis: RedisLike,
    options: RedisSessionStoreOptions = {}
  ) {
    super()
    this.prefix = options.prefix ?? 'session'
  }

  async findByTokenHash(tokenHash: string): Promise<Nullable<SessionRecord>> {
    const raw = await this.redis.get(this.sessionKey(tokenHash))
    return raw ? (JSON.parse(raw) as SessionRecord) : null
  }

  async save(record: SessionRecord): Promise<void> {
    const key = this.sessionKey(record.tokenHash)
    await this.redis.set(key, JSON.stringify(record))
    await this.redis.expireat(key, Math.ceil(new Date(record.expiresAt).getTime() / 1000))
    await this.redis.sadd(this.userKey(record.userId), record.tokenHash)
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const record = await this.findByTokenHash(tokenHash)
    await this.redis.del(this.sessionKey(tokenHash))
    if (record) await this.redis.srem(this.userKey(record.userId), tokenHash)
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    const hashes = await this.redis.smembers(this.userKey(userId))
    if (hashes.length) await this.redis.del(...hashes.map(h => this.sessionKey(h)))
    await this.redis.del(this.userKey(userId))
  }

  private sessionKey(tokenHash: string): string {
    return `${this.prefix}:${tokenHash}`
  }

  private userKey(userId: string): string {
    return `${this.prefix}:user:${userId}`
  }
}
