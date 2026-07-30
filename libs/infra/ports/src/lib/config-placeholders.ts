const VAULT_PREFIX = 'vault.'

/**
 * Provider-neutral `vault.*` placeholder walker (extracted from config-azure when the
 * second loader — AWS — arrived; rule of two). The SAME app config works against any
 * secret manager: only the composition root picks the loader.
 *
 * Naming convention: `vault.typeorm.host` → secret `typeorm-host` (prefix stripped,
 * dots joined with `separator`, '-' by default; AWS may prefer '/').
 */

/** True when any (possibly nested) value is a `vault.*` placeholder. */
export function containsVaultReferences(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.startsWith(VAULT_PREFIX)
  }

  if (Array.isArray(value)) {
    return value.some(containsVaultReferences)
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).some(containsVaultReferences)
  }

  return false
}

export interface ResolvePlaceholderOptions {
  separator?: string
}

/**
 * Deep-clones `config`, replacing every `vault.*` string with the value returned by
 * `lookup(secretName)`. Non-vault values are returned untouched.
 */
export async function resolvePlaceholders<T>(
  config: T,
  lookup: (secretName: string) => Promise<string | undefined>,
  options: ResolvePlaceholderOptions = {}
): Promise<T> {
  if (typeof config === 'string' && config.startsWith(VAULT_PREFIX)) {
    const secretName = config.slice(VAULT_PREFIX.length).replace(/\./g, options.separator ?? '-')
    return (await lookup(secretName)) as unknown as T
  }

  if (Array.isArray(config)) {
    return (await Promise.all(config.map(item => resolvePlaceholders(item, lookup, options)))) as unknown as T
  }

  if (config !== null && typeof config === 'object') {
    const resolved: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(config)) {
      resolved[key] = await resolvePlaceholders(value, lookup, options)
    }

    return resolved as T
  }

  return config
}
