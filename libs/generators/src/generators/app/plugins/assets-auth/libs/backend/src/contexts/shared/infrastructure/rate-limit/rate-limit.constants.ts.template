// Nombre del throttler global (aparece en los headers X-RateLimit-*-global).
export const GLOBAL_THROTTLER = 'global'

// Límites por endpoint sensibles a abuso. Los aplican los decoradores @Throttle en los
// controllers de auth; el límite GLOBAL vive en config (por entorno, ver RateLimitConfig).
// Una sola fuente para los números: este fichero.
export const AUTH_RATE_LIMITS = {
  // Complementa el bloqueo por cuenta (5 fallos -> 15 min): ataja el password spraying
  // (1 intento x N cuentas) que ese bloqueo no puede ver.
  LOGIN: { limit: 10, ttlMs: 60_000 },
  // Cada petición manda un correo: el endpoint más caro y el más abusable como bomba de spam.
  FORGOT_PASSWORD: { limit: 5, ttlMs: 3_600_000 },
  // Adivinar un token de 32 bytes es inviable, pero no hay motivo para permitir barridos
  // (canjes de invitación y de reset de contraseña).
  TOKEN_REDEMPTION: { limit: 20, ttlMs: 3_600_000 }
} as const
