import { Nullable, TenantRequestContext, TenantResolver } from '@raptor/infra-ports'

export interface HostTenantResolverOptions {
  /** Allowlist: first host label ('acme' in acme.example.com) → tenant id */
  tenants: Record<string, string>
}

/**
 * Resolves the tenant from the request subdomain against an explicit allowlist.
 * Unknown subdomains resolve to null (never a fallback tenant): an attacker
 * pointing an arbitrary CNAME must not land inside another tenant.
 */
export class HostTenantResolver extends TenantResolver {
  constructor(private readonly options: HostTenantResolverOptions) {
    super()
  }

  resolve(ctx: TenantRequestContext): Nullable<string> {
    if (!ctx.host) return null

    const label = ctx.host.split(':')[0].split('.')[0]
    return this.options.tenants[label] ?? null
  }
}
