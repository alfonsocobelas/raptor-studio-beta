import { describe, expect, it } from 'vitest'
import { applyDone, applyEvent, initialPhases, type PhaseState } from './generate-phases'

const status = (phases: PhaseState[], key: string): string => phases.find(p => p.key === key)?.status ?? 'ausente'
const phase = (phases: PhaseState[], key: string): PhaseState => {
  const found = phases.find(p => p.key === key)
  if (!found) throw new Error(`no hay fase ${key}`)
  return found
}

describe('initialPhases', () => {
  it('las pinta todas desde el principio, pendientes y en el orden REAL del generador', () => {
    // escribe, ajusta y por último instala: el orden de la maqueta (instalar el segundo)
    // no es el que ocurre, y la pantalla cuenta lo que pasa, no lo que se dibujó
    expect(initialPhases({ skipInstall: false }).map(p => p.key)).toEqual(['prepare', 'write', 'configure', 'install'])
    expect(initialPhases({ skipInstall: false }).every(p => p.status === 'pending')).toBe(true)
  })

  it('si se pidió no instalar, esa fase nace omitida y no pendiente para siempre', () => {
    expect(status(initialPhases({ skipInstall: true }), 'install')).toBe('skipped')
  })

  it('cada fase se presenta con su nombre y lo que hace', () => {
    expect(phase(initialPhases({ skipInstall: false }), 'write').label).toBe('Escribiendo el código')
    expect(phase(initialPhases({ skipInstall: false }), 'write').hint).toBeTruthy()
  })
})

describe('applyEvent', () => {
  const start = initialPhases({ skipInstall: false })

  it('la fase que llega se pone en curso', () => {
    const phases = applyEvent(start, { phase: 'prepare' }, 1000)

    expect(status(phases, 'prepare')).toBe('running')
    expect(status(phases, 'write')).toBe('pending')
  })

  it('la siguiente cierra la anterior con el tiempo que tardó', () => {
    const phases = applyEvent(applyEvent(start, { phase: 'prepare' }, 1000), { phase: 'write' }, 5000)

    expect(status(phases, 'prepare')).toBe('done')
    expect(phase(phases, 'prepare').elapsedMs).toBe(4000)
    expect(status(phases, 'write')).toBe('running')
  })

  /** Llegan cientos de líneas `CREATE`: el cronómetro no se reinicia con cada una. */
  it('repetir la fase en curso no reinicia su cronómetro', () => {
    const phases = [
      { phase: 'write' as const, at: 1000 },
      { phase: 'write' as const, at: 3000 },
      { phase: 'write' as const, at: 9000 }
    ].reduce((state, e) => applyEvent(state, { phase: e.phase }, e.at), start)

    expect(applyDone(phases, 10000, true).find(p => p.key === 'write')?.elapsedMs).toBe(9000)
  })

  it('el contador de ficheros va con la fase que los escribe', () => {
    const phases = applyEvent(
      applyEvent(start, { phase: 'write', files: 1 }, 1000),
      { phase: 'write', files: 120 },
      2000
    )

    expect(phase(phases, 'write').files).toBe(120)
  })

  it('los paquetes instalados se quedan en su fase', () => {
    const phases = applyEvent(start, { phase: 'install', packages: 1247 }, 1000)

    expect(phase(phases, 'install').packages).toBe(1247)
  })

  /**
   * El generador no siempre declara todas sus fases (puede no tocar configuración). Si se
   * salta una y arranca la siguiente, la de en medio se da por cumplida —ocurrió, no la
   * vimos— pero SIN tiempo: no se inventa una duración que nadie midió.
   */
  it('una fase que nunca se anunció se da por cumplida al arrancar la siguiente, sin tiempo', () => {
    const phases = applyEvent(applyEvent(start, { phase: 'prepare' }, 1000), { phase: 'install' }, 4000)

    expect(status(phases, 'write')).toBe('done')
    expect(phase(phases, 'write').elapsedMs).toBeUndefined()
    expect(status(phases, 'configure')).toBe('done')
  })

  it('no revive lo omitido: si no se instala, saltársela no la marca cumplida', () => {
    const phases = applyEvent(initialPhases({ skipInstall: true }), { phase: 'configure' }, 1000)

    expect(status(phases, 'install')).toBe('skipped')
  })

  /**
   * `CREATE` y `UPDATE` se intercalan en la salida de Nx. La lista es una línea de tiempo:
   * si retrocediera, la pantalla parpadearía entre dos filas toda la generación.
   */
  it('no retrocede: una fase anterior que reaparece no vuelve a ponerse en curso', () => {
    const phases = [
      { phase: 'write' as const, at: 1000 },
      { phase: 'configure' as const, at: 2000 },
      { phase: 'write' as const, at: 2500 }
    ].reduce((state, e) => applyEvent(state, { phase: e.phase }, e.at), start)

    expect(status(phases, 'configure')).toBe('running')
    expect(status(phases, 'write')).toBe('done')
  })

  it('pero sigue contando sus ficheros aunque la fase ya pasara', () => {
    const writing = applyEvent(start, { phase: 'write', files: 10 }, 1000)
    const configuring = applyEvent(writing, { phase: 'configure' }, 2000)

    const later = applyEvent(configuring, { phase: 'write', files: 33 }, 2500)

    expect(phase(later, 'write').files).toBe(33)
  })

  it('un error marca en fallo la fase que estuviera en curso', () => {
    const phases = applyEvent(applyEvent(start, { phase: 'write' }, 1000), { phase: 'error' }, 3000)

    expect(status(phases, 'write')).toBe('failed')
    expect(phase(phases, 'write').elapsedMs).toBe(2000)
  })

  it('un error sin nada en curso no rompe nada', () => {
    expect(() => applyEvent(start, { phase: 'error' }, 1000)).not.toThrow()
  })

  it('un evento sin fase (backend viejo) se ignora sin romper', () => {
    expect(applyEvent(start, {}, 1000)).toEqual(start)
  })
})

describe('applyDone', () => {
  const running = applyEvent(initialPhases({ skipInstall: false }), { phase: 'install' }, 1000)

  it('al terminar bien, la fase en curso se cierra con su tiempo', () => {
    const phases = applyDone(running, 6000, true)

    expect(status(phases, 'install')).toBe('done')
    expect(phase(phases, 'install').elapsedMs).toBe(5000)
  })

  it('al terminar mal, la fase en curso queda en fallo', () => {
    expect(status(applyDone(running, 6000, false), 'install')).toBe('failed')
  })

  it('lo que quedó pendiente sigue pendiente: terminar no es haberlo hecho todo', () => {
    const phases = applyDone(applyEvent(initialPhases({ skipInstall: false }), { phase: 'write' }, 1000), 2000, false)

    expect(status(phases, 'install')).toBe('pending')
  })
})
