import { SessionRecord } from '@acc/infra-ports'
import { HeaderTenantResolver } from './header-tenant-resolver'
import { HostTenantResolver } from './host-tenant-resolver'
import { InMemorySessionStore } from './in-memory-session-store'
import { TenantScopedSessionStore } from './tenant-scoped-session-store'

// Fechas relativas al reloj: el store poda lo caducado con Date.now(), así que una
// expiresAt absoluta convierte la suite en una bomba de relojería (pasó el 2026-07-31:
// dos días después de escribirse, los tests enrojecieron sin que nadie tocara nada).
const record = (overrides: Partial<SessionRecord> = {}): SessionRecord => ({
  id: 's-1',
  userId: 'u-1',
  tokenHash: 'hash-1',
  createdAt: new Date(Date.now() - 60_000).toISOString(),
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  lastSeenAt: new Date(Date.now() - 60_000).toISOString(),
  ...overrides
})

describe('HeaderTenantResolver', () => {
  it('resolves the tenant from the configured header (case-insensitive)', () => {
    const resolver = new HeaderTenantResolver()
    expect(resolver.resolve({ headers: { 'X-Tenant-Id': 'acme' } })).toBe('acme')
    expect(resolver.resolve({ headers: { 'x-tenant-id': 'acme' } })).toBe('acme')
  })

  it('returns null when the header is missing or multi-valued', () => {
    const resolver = new HeaderTenantResolver()
    expect(resolver.resolve({ headers: {} })).toBeNull()
    expect(resolver.resolve({ headers: { 'x-tenant-id': ['a', 'b'] } })).toBeNull()
  })
})

describe('HostTenantResolver', () => {
  it('maps the first host label through the allowlist', () => {
    const resolver = new HostTenantResolver({ tenants: { acme: 'tenant-acme', globex: 'tenant-globex' } })
    expect(resolver.resolve({ headers: {}, host: 'acme.dashboards.example.com' })).toBe('tenant-acme')
    expect(resolver.resolve({ headers: {}, host: 'globex.dashboards.example.com:443' })).toBe('tenant-globex')
  })

  it('returns null for unknown subdomains (never a fallback tenant)', () => {
    const resolver = new HostTenantResolver({ tenants: { acme: 'tenant-acme' } })
    expect(resolver.resolve({ headers: {}, host: 'evil.dashboards.example.com' })).toBeNull()
    expect(resolver.resolve({ headers: {} })).toBeNull()
  })
})

describe('TenantScopedSessionStore', () => {
  it('stamps the tenant on save and finds only its own sessions', async () => {
    const inner = new InMemorySessionStore()
    const acme = new TenantScopedSessionStore(inner, 'tenant-acme')
    const globex = new TenantScopedSessionStore(inner, 'tenant-globex')

    await acme.save(record())

    expect(await acme.findByTokenHash('hash-1')).toMatchObject({ tenantId: 'tenant-acme' })
    expect(await globex.findByTokenHash('hash-1')).toBeNull()
  })

  it('refuses to delete sessions of another tenant', async () => {
    const inner = new InMemorySessionStore()
    const acme = new TenantScopedSessionStore(inner, 'tenant-acme')
    const globex = new TenantScopedSessionStore(inner, 'tenant-globex')

    await acme.save(record())
    await globex.deleteByTokenHash('hash-1')

    expect(await acme.findByTokenHash('hash-1')).not.toBeNull()
  })
})
