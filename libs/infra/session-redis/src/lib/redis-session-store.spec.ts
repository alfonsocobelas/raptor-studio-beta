import { SessionRecord } from '@raptor/infra-ports'
import { RedisLike, RedisSessionStore } from './redis-session-store'

const record = (over: Partial<SessionRecord> = {}): SessionRecord => ({
  id: 'sess-1',
  userId: 'user-1',
  tokenHash: 'hash-1',
  createdAt: '2026-07-30T10:00:00.000Z',
  expiresAt: '2026-07-30T12:00:00.000Z',
  lastSeenAt: '2026-07-30T10:00:00.000Z',
  ...over
})

function fakeRedis(): RedisLike & { data: Map<string, string>; sets: Map<string, Set<string>> } {
  const data = new Map<string, string>()
  const sets = new Map<string, Set<string>>()
  return {
    data,
    sets,
    get: jest.fn(async key => data.get(key) ?? null),
    set: jest.fn(async (key, value) => data.set(key, value)),
    expireat: jest.fn(async () => 1),
    del: jest.fn(async (...keys) => keys.forEach(k => (data.delete(k), sets.delete(k)))),
    sadd: jest.fn(async (key, member) => sets.set(key, (sets.get(key) ?? new Set()).add(member))),
    srem: jest.fn(async (key, member) => sets.get(key)?.delete(member)),
    smembers: jest.fn(async key => [...(sets.get(key) ?? [])])
  }
}

describe('RedisSessionStore', () => {
  it('round-trips a session record by token hash', async () => {
    const redis = fakeRedis()
    const store = new RedisSessionStore(redis)

    await store.save(record())
    const found = await store.findByTokenHash('hash-1')

    expect(found).toEqual(record())
  })

  it('sets the native TTL at expiresAt and indexes the user set', async () => {
    const redis = fakeRedis()
    const store = new RedisSessionStore(redis)

    await store.save(record())

    expect(redis.expireat).toHaveBeenCalledWith(
      'session:hash-1',
      Math.ceil(Date.parse('2026-07-30T12:00:00.000Z') / 1000)
    )
    expect(await redis.smembers('session:user:user-1')).toEqual(['hash-1'])
  })

  it('returns null for unknown token hashes', async () => {
    const store = new RedisSessionStore(fakeRedis())

    expect(await store.findByTokenHash('nope')).toBeNull()
  })

  it('deletes a single session and its user-set entry', async () => {
    const redis = fakeRedis()
    const store = new RedisSessionStore(redis)
    await store.save(record())

    await store.deleteByTokenHash('hash-1')

    expect(await store.findByTokenHash('hash-1')).toBeNull()
    expect(await redis.smembers('session:user:user-1')).toEqual([])
  })

  it('logout-everywhere removes every session of the user', async () => {
    const redis = fakeRedis()
    const store = new RedisSessionStore(redis)
    await store.save(record())
    await store.save(record({ id: 'sess-2', tokenHash: 'hash-2' }))

    await store.deleteAllByUserId('user-1')

    expect(await store.findByTokenHash('hash-1')).toBeNull()
    expect(await store.findByTokenHash('hash-2')).toBeNull()
  })

  it('honors a custom key prefix', async () => {
    const redis = fakeRedis()
    const store = new RedisSessionStore(redis, { prefix: 'acc' })

    await store.save(record())

    expect(redis.set).toHaveBeenCalledWith('acc:hash-1', expect.any(String))
  })
})
