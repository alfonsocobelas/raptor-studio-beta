import { clientIp, RequestWithForwarding } from '../../../src/contexts/shared/infrastructure/rate-limit/client-ip'

const requestWith = (xff: string | undefined, socketIp = '100.100.1.28'): RequestWithForwarding => ({
  ip: socketIp,
  headers: xff === undefined ? {} : { 'x-forwarded-for': xff }
})

describe('clientIp', () => {
  it('con 0 saltos de confianza (el default emitido) el header no se mira: gana el socket', () => {
    // GIVEN — sin proxy delante, todo XFF lo escribió el cliente y es falsificable
    const ip = clientIp(requestWith('1.2.3.4, 5.6.7.8', '127.0.0.1'), 0)

    // THEN
    expect(ip).toBe('127.0.0.1')
  })

  it('sin header XFF vale la IP del socket (tráfico local, tests)', () => {
    const ip = clientIp(requestWith(undefined, '127.0.0.1'), 3)

    expect(ip).toBe('127.0.0.1')
  })

  it('extrae el cliente de una cadena limpia: exactamente las N entradas de nuestros proxies', () => {
    // GIVEN — topología de 3 saltos: cliente, proxy de entrada, proxy interno
    const ip = clientIp(requestWith('80.29.32.16, 100.100.0.114, 100.100.1.28'), 3)

    // THEN
    expect(ip).toBe('80.29.32.16')
  })

  it('ignora un prefijo falsificado por el cliente: las entradas de la izquierda nunca ganan', () => {
    const ip = clientIp(requestWith('1.2.3.4, 80.29.32.16, 100.100.0.61, 100.100.1.28'), 3)

    // THEN — la mentira (1.2.3.4) queda fuera; gana la posición N desde la derecha
    expect(ip).toBe('80.29.32.16')
  })

  it('cadena más corta que N (un entorno con menos proxies): clamp a la entrada más antigua', () => {
    const ip = clientIp(requestWith('80.29.32.16, 100.100.1.28'), 3)

    expect(ip).toBe('80.29.32.16')
  })

  it('acepta el header en forma de array (proxies que lo repiten en vez de concatenar)', () => {
    const request: RequestWithForwarding = {
      ip: '100.100.1.28',
      headers: { 'x-forwarded-for': ['80.29.32.16, 100.100.0.114', '100.100.1.28'] }
    }

    expect(clientIp(request, 3)).toBe('80.29.32.16')
  })
})
