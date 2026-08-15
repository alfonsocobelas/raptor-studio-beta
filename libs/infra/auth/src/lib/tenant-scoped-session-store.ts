import { Nullable, SessionRecord, SessionStore } from '@raptor/infra-ports'

/**
 * Multi-tenant decorator over ANY SessionStore (in-memory, redis, typeorm):
 * stamps the tenant on save and enforces isolation on every read/delete —
 * a token valid in tenant A resolves to null in tenant B. One instance per
 * tenant, all sharing the same inner store (regla de los dos: decorator, not
 * per-adapter forks). userIds are UUIDv7 (globally unique across tenants), so
 * deleteAllByUserId cannot cross tenants by collision.
 */
export class TenantScopedSessionStore extends SessionStore {
  constructor(
    private readonly inner: SessionStore,
    private readonly tenantId: string
  ) {
    super()
  }

  async findByTokenHash(tokenHash: string): Promise<Nullable<SessionRecord>> {
    const record = await this.inner.findByTokenHash(tokenHash)
    return record && record.tenantId === this.tenantId ? record : null
  }

  async save(record: SessionRecord): Promise<void> {
    await this.inner.save({ ...record, tenantId: this.tenantId })
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const record = await this.findByTokenHash(tokenHash)
    if (!record) return

    await this.inner.deleteByTokenHash(tokenHash)
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.inner.deleteAllByUserId(userId)
  }
}
