export interface RequestWithForwarding {
  ip?: string
  headers?: Record<string, string | string[] | undefined>
}

// IP real del cliente: la entrada N-ésima desde la DERECHA de X-Forwarded-For, donde N es el
// número de proxies de confianza entre el cliente y el backend (config `rateLimit.trustedProxyHops`,
// MEDIDO en cada despliegue — nunca ajustado a ojo). Las entradas de la derecha las añadieron
// nuestros proxies; el extremo izquierdo lo controla el cliente y es falsificable — nunca gana.
// Con 0 saltos (sin proxy delante, el default emitido) el header entero es del cliente y no se
// mira: vale la IP del socket. Sin XFF (tráfico local, tests) también.
export function clientIp(request: RequestWithForwarding, trustedProxyHops: number): string {
  if (trustedProxyHops <= 0) {
    return request.ip ?? ''
  }

  const rawHeader = request.headers?.['x-forwarded-for']
  const headerValue = Array.isArray(rawHeader) ? rawHeader.join(',') : rawHeader

  const entries = (headerValue ?? '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)

  if (entries.length === 0) {
    return request.ip ?? ''
  }

  // Cadena más corta que N (un entorno con menos proxies): clamp a la entrada más antigua.
  const index = Math.max(0, entries.length - trustedProxyHops)
  return entries[index]
}
