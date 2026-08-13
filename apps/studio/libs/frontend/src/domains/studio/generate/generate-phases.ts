/**
 * Las fases de la generación, tal como las cuenta la pantalla (spec 42). Todo lo que la
 * pantalla sabe se calcula aquí: qué fase va, cuál cerró y cuánto tardó. El componente solo
 * pinta lo que este fichero devuelve.
 *
 * Dos decisiones que gobiernan el resto:
 *
 * - **El orden es el REAL del generador**, no el de la maqueta: prepara, escribe y por último
 *   instala. La pantalla cuenta lo que pasa, no lo que se dibujó. Instalar va al final porque
 *   no puede ir en otro sitio: el generador escribe en un árbol en memoria y las dependencias
 *   las deciden los plugins DURANTE la generación, así que hasta el final ni existe el
 *   `package.json` en disco ni se sabe qué hay que instalar.
 * - **No hay fila para «ajustar la configuración».** Medido en una generación real (log de
 *   1421 líneas, 2026-08-13): 1404 `CREATE` seguidos y ni un `UPDATE`. Era una fila que no
 *   se encendía nunca y que además torcía la aritmética de la barra.
 * - **La lista solo avanza.** `CREATE` y `UPDATE` se intercalan en la salida de Nx, así que
 *   una fase anterior que reaparece no vuelve a ponerse en curso —la pantalla parpadearía
 *   entre dos filas toda la generación—, aunque sus contadores sí siguen subiendo.
 */
export type PhaseKey = 'prepare' | 'write' | 'install'
export type PhaseStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed'

export interface PhaseState {
  key: PhaseKey
  label: string
  hint: string
  status: PhaseStatus
  /** Lo que tardó, cuando se pudo medir. Ausente si la fase pasó sin anunciarse. */
  elapsedMs?: number
  /** Ficheros escritos hasta ahora (solo la fase que escribe) */
  files?: number
  /** Paquetes instalados, cuando npm los declara (solo la fase que instala) */
  packages?: number
  /** Marca de tiempo en que empezó; interno para cronometrar */
  startedAt?: number
}

/** Lo que llega del stream, en lo que a fases respecta. */
export interface PhaseEvent {
  phase?: PhaseKey | 'error' | string
  files?: number
  packages?: number
}

const CATALOG: { key: PhaseKey; label: string; hint: string }[] = [
  { key: 'prepare', label: 'Preparando el proyecto', hint: 'Estructura de carpetas y configuración base' },
  { key: 'write', label: 'Escribiendo el código', hint: 'Entidades, vistas y módulos' },
  { key: 'install', label: 'Instalando dependencias', hint: 'npm install + los componentes · un par de minutos' }
]

/** El backend distingue el `UPDATE` como fase propia; aquí es el mismo momento que escribir. */
const EVENT_ALIASES: Record<string, PhaseKey> = { configure: 'write' }

/**
 * Lo que suele costar cada fase que admite estimación, MEDIDO, no supuesto: una app
 * completa fueron 1404 ficheros y 1740 paquetes en 2 minutos (log del 2026-08-13). Sirven
 * para que la barra avance dentro de la fase; si la máquina va más lenta, la barra se
 * frena, nunca miente.
 */
export const EXPECTED_FILES = 1400
export const EXPECTED_INSTALL_MS = 120_000

/** La estimación no cierra una fase: eso solo lo hace el evento real. */
const ESTIMATE_CAP = 0.95

export function initialPhases(options: { skipInstall: boolean }): PhaseState[] {
  return CATALOG.map(entry => ({
    ...entry,
    status: entry.key === 'install' && options.skipInstall ? 'skipped' : 'pending'
  }))
}

export function applyEvent(phases: PhaseState[], event: PhaseEvent, atMs: number): PhaseState[] {
  if (!event.phase) {
    return phases
  }
  if (event.phase === 'error') {
    return phases.map(p => (p.status === 'running' ? close(p, atMs, 'failed') : p))
  }

  const key = EVENT_ALIASES[event.phase] ?? event.phase
  const target = phases.findIndex(p => p.key === key)
  if (target === -1) {
    return phases
  }
  const current = phases.findIndex(p => p.status === 'running')
  // una fase pasada que reaparece solo actualiza sus contadores: la línea de tiempo no vuelve
  const advances = target > current

  return phases.map((p, index) => {
    const counted = index === target ? withCounters(p, event) : p
    if (!advances) {
      return counted
    }
    if (index === target) {
      return { ...counted, status: 'running', startedAt: atMs }
    }
    if (index === current) {
      return close(counted, atMs, 'done')
    }
    // las de en medio ocurrieron aunque no se anunciaran: cumplidas, pero SIN tiempo inventado
    if (index < target && counted.status === 'pending') {
      return { ...counted, status: 'done' }
    }
    return counted
  })
}

/** El final del stream: lo que estuviera en curso se cierra según haya ido. */
export function applyDone(phases: PhaseState[], atMs: number, ok: boolean): PhaseState[] {
  return phases.map(p => (p.status === 'running' ? close(p, atMs, ok ? 'done' : 'failed') : p))
}

/**
 * Lo que lleva esta fase: en vivo mientras dura —los segundos tienen que correr durante los
 * dos minutos de la instalación, no aparecer al final— y congelado en cuanto cierra.
 * `undefined` si no ha empezado: no hay nada que cronometrar.
 */
export function elapsedOf(phase: PhaseState, nowMs: number): number | undefined {
  if (phase.status === 'running' && phase.startedAt !== undefined) return nowMs - phase.startedAt
  return phase.elapsedMs
}

/**
 * Cuánto se lleva andado, de 0 a 1: las fases cerradas más la fracción de la que está en
 * curso. Sin esa fracción la barra saltaba de tercio en tercio y se quedaba clavada los dos
 * minutos que dura instalar, que es justo cuando hace falta que se mueva.
 */
export function overallProgress(phases: PhaseState[], nowMs: number): number {
  if (!phases.length) return 0
  const settled = phases.filter(p => p.status !== 'pending' && p.status !== 'running').length
  const running = phases.find(p => p.status === 'running')
  return Math.min((settled + (running ? runningFraction(running, nowMs) : 0)) / phases.length, 1)
}

/**
 * Escribir tiene medida real (ficheros escritos); instalar no la tiene —npm solo canta el
 * `added N packages` cuando ya terminó—, así que se estima con el reloj contra lo que suele
 * tardar. Preparar dura un parpadeo y no merece estimación.
 */
function runningFraction(phase: PhaseState, nowMs: number): number {
  if (phase.key === 'write') return Math.min((phase.files ?? 0) / EXPECTED_FILES, ESTIMATE_CAP)
  if (phase.key === 'install') return Math.min((elapsedOf(phase, nowMs) ?? 0) / EXPECTED_INSTALL_MS, ESTIMATE_CAP)
  return 0
}

function close(phase: PhaseState, atMs: number, status: PhaseStatus): PhaseState {
  return {
    ...phase,
    status,
    ...(phase.startedAt !== undefined ? { elapsedMs: atMs - phase.startedAt } : {})
  }
}

function withCounters(phase: PhaseState, event: PhaseEvent): PhaseState {
  return {
    ...phase,
    ...(event.files !== undefined ? { files: event.files } : {}),
    ...(event.packages !== undefined ? { packages: event.packages } : {})
  }
}
