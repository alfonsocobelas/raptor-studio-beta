import { Nullable, TenantRequestContext, TenantResolver } from '@acc/infra-ports'

export interface HeaderTenantResolverOptions {
  /** Header carrying the tenant id; defaults to 'x-tenant-id' */
  header?: string
}

/**
 * Resolves the tenant from a request header (API gateways / BFFs that already
 * authenticated the caller stamp it). A multi-valued header is ambiguous and
 * resolves to null — the caller must reject the request.
 */
export class HeaderTenantResolver extends TenantResolver {
  private readonly header: string

  constructor(options: HeaderTenantResolverOptions = {}) {
    super()
    this.header = (options.header ?? 'x-tenant-id').toLowerCase()
  }

  resolve(ctx: TenantRequestContext): Nullable<string> {
    const match = Object.entries(ctx.headers).find(([name]) => name.toLowerCase() === this.header)
    const value = match?.[1]

    return typeof value === 'string' && value !== '' ? value : null
  }
}
