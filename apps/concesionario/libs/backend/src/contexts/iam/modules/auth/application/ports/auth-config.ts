export abstract class AuthConfig {
  /** Absolute base URL of the frontend app, used to build invitation/reset links. */
  abstract get appBaseUrl(): string
}
