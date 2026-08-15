import { Clock } from '@raptor/infra-ports'
import { OidcCodeFlowOptions, OidcCodeFlowProvider, OidcFetchLike } from './oidc-code-flow-provider'

export interface MicrosoftOidcOptions extends OidcCodeFlowOptions {
  /**
   * Tenant de Entra ID: GUID del directorio (single-tenant, recomendado) u
   * 'organizations'. Con tenant multi ('organizations'/'common') el emisor del
   * id_token lleva el GUID del tenant del usuario: se valida por patrón.
   */
  tenant: string
}

const ISSUER_PATTERN = /^https:\/\/login\.microsoftonline\.com\/[0-9a-f-]+\/v2\.0$/i

/** Microsoft Entra ID (OIDC v2). App registration con client secret. */
export class MicrosoftOidcProvider extends OidcCodeFlowProvider {
  constructor(options: MicrosoftOidcOptions, fetchFn?: OidcFetchLike, clock?: Clock) {
    const singleTenant = options.tenant !== 'organizations' && options.tenant !== 'common'
    super(
      {
        name: 'microsoft',
        authorizationEndpoint: `https://login.microsoftonline.com/${options.tenant}/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://login.microsoftonline.com/${options.tenant}/oauth2/v2.0/token`,
        scopes: 'openid email profile',
        isTrustedIssuer: iss =>
          singleTenant
            ? iss === `https://login.microsoftonline.com/${options.tenant}/v2.0`
            : ISSUER_PATTERN.test(iss)
      },
      options,
      fetchFn,
      clock
    )
  }
}
