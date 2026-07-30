import { RootValidator, validate } from '../../config-validation'
import { loadRawConfig } from '../config-sources'
import { containsVaultReferences, createSecretClient, resolveSecrets } from './azure-secret-resolver'

/**
 * Azure-backed loader: bundled JSON with every `vault.*` placeholder resolved
 * against Azure Key Vault. When the config has no placeholders (local/test) it
 * skips Azure entirely, so no credentials are needed there.
 */
export default async (): Promise<RootValidator> => {
  const config = loadRawConfig()

  const resolved = containsVaultReferences(config) ? await resolveSecrets(config, createSecretClient()) : config

  return validate(resolved)
}
