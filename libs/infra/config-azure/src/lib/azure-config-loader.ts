import { containsVaultReferences, createSecretClient, resolveSecrets, SecretReader } from './azure-secret-resolver'

/**
 * Config seam of the catalog (extracted from the reference's azure-config-loader):
 * takes the app's raw config (bundled JSON per environment, loaded by the app) and
 * resolves `vault.*` placeholders against Key Vault. Key property: in local/test the
 * config has no placeholders, so Azure is never touched and no credentials are needed.
 *
 * Swap this loader for a different provider (Doppler, Infisical…) without touching
 * the app: the composition root is the only place that knows which one runs.
 */
export async function resolveAzureConfig<T>(rawConfig: T, client?: SecretReader): Promise<T> {
  if (!containsVaultReferences(rawConfig)) {
    return rawConfig
  }

  return resolveSecrets(rawConfig, client ?? createSecretClient())
}
