/* eslint-disable @typescript-eslint/no-explicit-any */

// Needles matched as a substring of the *normalized* key (lowercased, separators stripped).
// They are specific enough not to collide with common business fields:
// 'token' → accessToken/refreshToken, 'secret' → clientSecret, 'apikey' → apiKey/x-api-key, etc.
const SENSITIVE_NEEDLES = [
  'password',
  'passwd',
  'secret',
  'token',
  'apikey',
  'authorization',
  'credential',
  'cookie',
  'bearer',
  'jwt',
  'connectionstring',
  'sessionid'
]

// Short, ambiguous words matched only by exact (normalized) equality, so we don't mask
// innocuous fields like `authorName`, `primaryKey`, `monkey` or `passenger`.
const SENSITIVE_EXACT = new Set(['pass', 'pwd', 'auth', 'key'])

// Scrubs `word=value` / `word: value` patterns embedded in free-text strings.
const STRING_REGEX =
  /(password|passwd|pwd|secret|token|apikey|authorization|credential|cookie|bearer|jwt|connectionstring|sessionid)\s*[:=]\s*("[^"]*"|[^\s,;"]+)/gi

export class LoggerSanitizer {
  static sanitize(data: any): any {
    if (data === null || data === undefined) {
      return data
    }

    if (typeof data === 'string') {
      return data.replace(STRING_REGEX, '$1=***')
    }

    if (typeof data === 'object') {
      if (data instanceof Error) {
        return data.stack
      }

      const copy: any = Array.isArray(data) ? [] : {}

      for (const key of Object.keys(data)) {
        copy[key] = this.isSensitiveKey(key) ? '***' : this.sanitize(data[key])
      }

      return copy
    }

    return data
  }

  private static isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase().replace(/[-_\s]/g, '')

    if (SENSITIVE_EXACT.has(normalized)) {
      return true
    }

    return SENSITIVE_NEEDLES.some(needle => normalized.includes(needle))
  }
}
