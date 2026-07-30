// Stable port for secret managers (ADR-004). Adapters: Azure Key Vault (reference),
// Doppler (free tier), future Bitwarden/Infisical. Least common denominator: read-only
// lookup by name — admin APIs differ too much across providers to abstract.
export abstract class SecretsPort {
  /** Returns the secret value, or null when the provider has no such secret. */
  abstract get(name: string): Promise<string | null>
}
