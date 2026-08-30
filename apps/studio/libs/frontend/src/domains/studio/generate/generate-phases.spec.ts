import { describe, expect, it } from 'vitest'
import {
  applyDone,
  applyEvent,
  applySkip,
  elapsedOf,
  EXPECTED_FILES,
  EXPECTED_FILL_MS,
  EXPECTED_INSTALL_MS,
  EXPECTED_REPAIR_MS,
  EXPECTED_VALIDATE_MS,
  initialPhases,
  overallProgress,
  type PhaseState
} from './generate-phases'

const status = (phases: PhaseState[], key: string): string => phases.find(p => p.key === key)?.status ?? 'ausente'
const phase = (phases: PhaseState[], key: string): PhaseState => {
  const found = phases.find(p => p.key === key)
  if (!found) throw new Error(`no hay fase ${key}`)
  return found
}

describe('initialPhases', () => {
  it('las pinta todas desde el principio, pendientes y en el orden REAL del generador', () => {
    // prepara, escribe y por último instala: el orden de la maqueta (instalar el segundo)
    // no es el que ocurre, y la pantalla cuenta lo que pasa, no lo que se dibujó.
    // «Ajustando la configuración» NO está: en la generación real (log de 1421 líneas del
    // 2026-08-13) no salió ni un UPDATE, así que era una fila que nunca se encendía.
    // …y desde la spec 75 la obra sigue después de instalar: rellenar IA, validar, reparar.
    expect(initialPhases({ skipInstall: false }).map(p => p.key)).toEqual([
      'prepare',
      'write',
      'install',
      'fill',
      'validate',
      'repair'
    ])
    expect(
      initialPhases({ skipInstall: false })
        .filter(p => p.status === 'pending')
        .map(p => p.key)
    ).toEqual(['write', 'install', 'fill', 'validate', 'repair'])
  })

  /**
   * Pulsar y no ver nada es el peor momento de la pantalla: el arranque de Nx medido el
   * 2026-08-20 en una máquina cargada fueron 148 s hasta el primer fichero, y hasta entonces
   * el backend no manda un solo evento. La primera fase no espera a que se lo digan: si se
   * está generando, se está preparando.
   */
  it('la primera fase nace en curso: pulsar el botón ya es trabajo empezado', () => {
    const phases = initialPhases({ skipInstall: false, startedAt: 500 })

    expect(status(phases, 'prepare')).toBe('running')
    expect(phase(phases, 'prepare').startedAt).toBe(500)
  })

  it('si se pidió no instalar, esa fase nace omitida y no pendiente para siempre', () => {
    expect(status(initialPhases({ skipInstall: true }), 'install')).toBe('skipped')
  })

  /** Spec 75: sin node_modules no hay gate ni suite — las fases post-install nacen omitidas. */
  it('sin instalar tampoco hay relleno, validación ni reparación: nacen omitidas', () => {
    const phases = initialPhases({ skipInstall: true })

    expect(status(phases, 'fill')).toBe('skipped')
    expect(status(phases, 'validate')).toBe('skipped')
    expect(status(phases, 'repair')).toBe('skipped')
  })

  it('cada fase se presenta con su nombre y lo que hace', () => {
    expect(phase(initialPhases({ skipInstall: false }), 'write').label).toBe('Escribiendo el código')
    expect(phase(initialPhases({ skipInstall: false }), 'write').hint).toBeTruthy()
  })
})

describe('applyEvent', () => {
  // con hora de arranque explícita: prepare nace en curso y su cronómetro tiene que ser medible
  const start = initialPhases({ skipInstall: false, startedAt: 1000 })

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
  })

  it('no revive lo omitido: si no se instala, saltársela no la marca cumplida', () => {
    const phases = applyEvent(initialPhases({ skipInstall: true }), { phase: 'configure' }, 1000)

    expect(status(phases, 'install')).toBe('skipped')
  })

  /**
   * Las líneas de npm y los `CREATE` pueden solaparse en la salida. La lista es una línea de
   * tiempo: si retrocediera, la pantalla parpadearía entre dos filas toda la generación.
   */
  it('no retrocede: una fase anterior que reaparece no vuelve a ponerse en curso', () => {
    const phases = [
      { phase: 'write' as const, at: 1000 },
      { phase: 'install' as const, at: 2000 },
      { phase: 'write' as const, at: 2500 }
    ].reduce((state, e) => applyEvent(state, { phase: e.phase }, e.at), start)

    expect(status(phases, 'install')).toBe('running')
    expect(status(phases, 'write')).toBe('done')
  })

  it('pero sigue contando sus ficheros aunque la fase ya pasara', () => {
    const writing = applyEvent(start, { phase: 'write', files: 10 }, 1000)
    const installing = applyEvent(writing, { phase: 'install' }, 2000)

    const later = applyEvent(installing, { phase: 'write', files: 33 }, 2500)

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

  /**
   * El backend sigue distinguiendo `UPDATE` como fase propia. Sin fila que lo cuente, ese
   * evento es el mismo momento que escribir —Nx vuelca el árbol— y ahí se contabiliza.
   */
  it('un UPDATE cae en la fase que escribe, que es cuando ocurre', () => {
    const phases = applyEvent(applyEvent(start, { phase: 'write' }, 1000), { phase: 'configure' }, 3000)

    expect(status(phases, 'write')).toBe('running')
    expect(status(phases, 'install')).toBe('pending')
  })

  it('un UPDATE antes de escribir enciende la fase que escribe', () => {
    expect(status(applyEvent(start, { phase: 'configure' }, 1000), 'write')).toBe('running')
  })
})

describe('elapsedOf', () => {
  const start = initialPhases({ skipInstall: false })

  it('la fase en curso cronometra en vivo: los segundos corren mientras dura', () => {
    const phases = applyEvent(start, { phase: 'install' }, 1000)

    expect(elapsedOf(phase(phases, 'install'), 4000)).toBe(3000)
  })

  it('la fase cerrada se queda con lo que tardó, no sigue corriendo', () => {
    const phases = applyDone(applyEvent(start, { phase: 'install' }, 1000), 6000, true)

    expect(elapsedOf(phase(phases, 'install'), 60000)).toBe(5000)
  })

  it('la que no ha empezado no tiene tiempo que enseñar', () => {
    expect(elapsedOf(phase(start, 'install'), 4000)).toBeUndefined()
  })
})

describe('overallProgress', () => {
  const start = initialPhases({ skipInstall: false, startedAt: 0 })

  it('sin empezar, cero', () => {
    expect(overallProgress(start, 0)).toBe(0)
  })

  it('todo cerrado, uno', () => {
    const advanced = ['install', 'fill', 'validate', 'repair'].reduce(
      (acc, key, i) => applyEvent(acc, { phase: key }, 1000 + i),
      start
    )
    const phases = applyDone(advanced, 2000, true)

    expect(overallProgress(phases, 3000)).toBe(1)
  })

  /** Lo que escribe SÍ tiene medida real: ficheros escritos contra los que suele haber. */
  it('mientras escribe avanza con los ficheros, no con el reloj', () => {
    const phases = applyEvent(start, { phase: 'write', files: EXPECTED_FILES / 2 }, 1000)
    const fraction = overallProgress(phases, 60000)

    // una de seis cerrada (prepare) + media fase escribiendo
    expect(fraction).toBeCloseTo((1 + 0.5) / 6, 5)
  })

  /**
   * Instalar no da progreso: npm solo canta al final. Lo honesto es estimar con el tiempo
   * que tardó la última medida (2 min en el log del 2026-08-13) y NO prometer el final.
   */
  it('mientras instala avanza con el reloj contra lo que suele tardar', () => {
    const phases = applyEvent(start, { phase: 'install' }, 1000)

    expect(overallProgress(phases, 1000 + EXPECTED_INSTALL_MS / 2)).toBeCloseTo((2 + 0.5) / 6, 5)
  })

  it('la estimación nunca llega al final sola: si tarda de más, se frena antes del tope', () => {
    const phases = applyEvent(start, { phase: 'install' }, 1000)
    const late = overallProgress(phases, 1000 + EXPECTED_INSTALL_MS * 10)

    expect(late).toBeLessThan(1)
    expect(late).toBeGreaterThan(overallProgress(phases, 1000 + EXPECTED_INSTALL_MS / 2))
  })

  /**
   * Preparar no tiene medida posible —depende de lo cargada que esté la máquina: 148 s en la
   * medición del 2026-08-20 contra los pocos segundos de una máquina libre—, así que se estima
   * con una curva que se frena sola: rápida al principio, cada vez más lenta, y nunca alcanza
   * el final de su fase. Es el «congelar la barra» sin el escalón de clavarse de golpe.
   */
  it('mientras prepara, la barra avanza aunque el backend aún no haya dicho nada', () => {
    const phases = initialPhases({ skipInstall: false, startedAt: 0 })

    const pronto = overallProgress(phases, 5_000)
    const luego = overallProgress(phases, 30_000)

    expect(pronto).toBeGreaterThan(0)
    expect(luego).toBeGreaterThan(pronto)
  })

  it('y por mucho que tarde el arranque, no termina su fase sola', () => {
    const phases = initialPhases({ skipInstall: false, startedAt: 0 })

    expect(overallProgress(phases, 10 * 60_000)).toBeLessThan(1 / 6)
  })

  it('la curva se frena: el segundo tramo de espera avanza menos que el primero', () => {
    const phases = initialPhases({ skipInstall: false, startedAt: 0 })
    const primero = overallProgress(phases, 15_000) - overallProgress(phases, 0)
    const segundo = overallProgress(phases, 30_000) - overallProgress(phases, 15_000)

    expect(segundo).toBeLessThan(primero)
  })

  it('la fase omitida cuenta como cerrada: no deja la barra corta para siempre', () => {
    const phases = applyDone(applyEvent(initialPhases({ skipInstall: true }), { phase: 'write' }, 1000), 2000, true)

    expect(overallProgress(phases, 3000)).toBe(1)
  })
})

/**
 * Spec 75: las fases post-install no pasan por describeProgress (no son la consola de Nx):
 * el runner las estima con el reloj, como instalar — el puente puede tardar minutos por
 * hueco y la suite ~2 min, y la barra tiene que moverse mientras tanto.
 */
describe('overallProgress — fases post-install (spec 75)', () => {
  const start = initialPhases({ skipInstall: false, startedAt: 0 })

  it.each([
    ['fill', EXPECTED_FILL_MS, 3],
    ['validate', EXPECTED_VALIDATE_MS, 4],
    ['repair', EXPECTED_REPAIR_MS, 5]
  ] as const)('la fase %s avanza con el reloj contra lo que suele tardar', (key, expectedMs, settled) => {
    const phases = applyEvent(start, { phase: key }, 1000)

    expect(overallProgress(phases, 1000 + expectedMs / 2)).toBeCloseTo((settled + 0.5) / 6, 5)
  })
})

/**
 * Spec 75: cuántos huecos hay solo se sabe al TERMINAR la generación (el `done` trae los
 * slots), así que rellenar y reparar no pueden nacer omitidas: se omiten sobre la marcha.
 */
describe('applySkip', () => {
  const start = initialPhases({ skipInstall: false, startedAt: 0 })

  it('marca omitida una fase pendiente', () => {
    const phases = applySkip(start, 'fill')

    expect(status(phases, 'fill')).toBe('skipped')
  })

  it('no toca una fase ya cerrada ni la que está en curso', () => {
    const running = applyEvent(start, { phase: 'validate' }, 1000)

    const phases = applySkip(applySkip(running, 'validate'), 'prepare')

    expect(status(phases, 'validate')).toBe('running')
    expect(status(phases, 'prepare')).toBe('done')
  })

  it('la fase omitida cuenta como andada en la barra', () => {
    const phases = applySkip(applySkip(applySkip(start, 'fill'), 'validate'), 'repair')

    // tres omitidas de seis: la barra parte de la mitad andada (prepare sigue en curso)
    expect(overallProgress(phases, 0)).toBeCloseTo(3 / 6, 5)
  })
})

describe('applyDone', () => {
  const running = applyEvent(initialPhases({ skipInstall: false, startedAt: 0 }), { phase: 'install' }, 1000)

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
