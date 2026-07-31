import { Clock } from '@acc/infra-ports'
import { OidcCodeFlowOptions, OidcCodeFlowProvider, OidcFetchLike } from './oidc-code-flow-provider'

/** Google Identity (OIDC). Credenciales de una OAuth 2.0 Client ID de tipo Web application. */
export class GoogleOidcProvider extends OidcCodeFlowProvider {
  constructor(options: OidcCodeFlowOptions, fetchFn?: OidcFetchLike, clock?: Clock) {
    super(
      {
        name: 'google',
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        scopes: 'openid email profile',
        isTrustedIssuer: iss => iss === 'https://accounts.google.com' || iss === 'accounts.google.com'
      },
      options,
      fetchFn,
      clock
    )
  }
}
