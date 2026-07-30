import { Nullable, SessionRecord, SessionStore } from '@acc/infra/ports'

/** Local/test adapter: sessions live in process memory. Expiry enforced on read. */
export class InMemorySessionStore extends SessionStore {
  private readonly byTokenHash = new Map<string, SessionRecord>()

  async findByTokenHash(tokenHash: string): Promise<Nullable<SessionRecord>> {
    const record = this.byTokenHash.get(tokenHash) ?? null
    if (record && new Date(record.expiresAt).getTime() <= Date.now()) {
      this.byTokenHash.delete(tokenHash)
      return null
    }
    return record
  }

  async save(record: SessionRecord): Promise<void> {
    this.byTokenHash.set(record.tokenHash, record)
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    this.byTokenHash.delete(tokenHash)
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    for (const [hash, record] of this.byTokenHash) {
      if (record.userId === userId) this.byTokenHash.delete(hash)
    }
  }
}
