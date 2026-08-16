import defaultConfig from '../environments/default.json'
import devConfig from '../environments/dev.json'
import localConfig from '../environments/local.json'
import prodConfig from '../environments/prod.json'
import qaConfig from '../environments/qa.json'
import testConfig from '../environments/test.json'

const CONFIGS: Record<string, Record<string, unknown>> = {
  default: defaultConfig,
  dev: devConfig,
  local: localConfig,
  prod: prodConfig,
  qa: qaConfig,
  test: testConfig
}

/**
 * Returns the raw environment config as bundled JSON (no secret resolution).
 * Static imports keep it bundle-safe; every loader builds on top of this.
 */
export function loadRawConfig(): Record<string, unknown> {
  // `??` (not `||`) on purpose: an unset NODE_ENV defaults to test (jest/tooling),
  // but NODE_ENV="" is a misconfiguration (a deploy set it empty) and must fail loudly
  // via the Unknown-NODE_ENV throw below, never silently load the test config (localhost DB).
  const env = process.env['NODE_ENV'] ?? 'test'
  const config = CONFIGS[env]

  if (!config) {
    throw new Error(`Unknown NODE_ENV: ${env}`)
  }

  return config
}
