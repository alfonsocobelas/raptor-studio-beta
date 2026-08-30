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
export type PhaseKey = 'prepare' | 'write' | 'install' | 'fill' | 'validate' | 'repair'
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
  { key: 'install', label: 'Instalando dependencias', hint: 'npm install + los componentes · un par de minutos' },
  // las fases post-install (spec 75): la obra sigue sola después de instalar
  { key: 'fill', label: 'Pasos de negocio (IA)', hint: 'El puente rellena los huecos, cada uno bajo su gate' },
  { key: 'validate', label: 'Validando la app', hint: 'Typecheck + suites de la propia app · un par de minutos' },
  { key: 'repair', label: 'Reparando huecos', hint: 'Solo dentro de los huecos IA; el canon no se toca' }
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
/** El puente puede tardar minutos por hueco; esto es solo para que la barra respire. */
export const EXPECTED_FILL_MS = 180_000
/** La suite emitida ronda los 2 min (typecheck-emitted.sh, medido). */
export const EXPECTED_VALIDATE_MS = 120_000
export const EXPECTED_REPAIR_MS = 180_000
/** Escala de la curva del arranque; no es una duración esperada, es lo rápido que se frena. */
export const PREPARE_SCALE_MS = 15_000

/** La estimación no cierra una fase: eso solo lo hace el evento real. */
const ESTIMATE_CAP = 0.95

export function initialPhases(options: { skipInstall: boolean; startedAt?: number }): PhaseState[] {
  const startedAt = options.startedAt ?? Date.now()
  return CATALOG.map(entry => ({
    ...entry,
    status: statusAtStart(entry.key, options.skipInstall),
    ...(entry.key === 'prepare' ? { startedAt } : {})
  }))
}

/**
 * Preparar empieza con el botón, no con el primer evento. Entre pulsar y el primer `CREATE`
 * pasan desde unos segundos hasta minutos —148 s medidos el 2026-08-20 en una máquina
 * cargada— y en todo ese rato el backend no manda nada: la pantalla se quedaba apagada
 * justo cuando más hace falta decir «te he oído».
 */
function statusAtStart(key: PhaseKey, skipInstall: boolean): PhaseStatus {
  // sin node_modules no hay gate ni suite: todo lo post-install nace omitido (spec 75)
  if (skipInstall && (key === 'install' || key === 'fill' || key === 'validate' || key === 'repair')) return 'skipped'
  return key === 'prepare' ? 'running' : 'pending'
}

/**
 * Omite sobre la marcha una fase aún pendiente (spec 75): cuántos huecos hay solo se
 * sabe al terminar la generación, y si hay que reparar solo lo dice la validación.
 */
export function applySkip(phases: PhaseState[], key: PhaseKey): PhaseState[] {
  return phases.map(p => (p.key === key && p.status === 'pending' ? { ...p, status: 'skipped' } : p))
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
 * Cada fase avanza con lo mejor que tiene. Escribir tiene medida real (ficheros escritos);
 * instalar no la tiene —npm solo canta el `added N packages` cuando ya terminó— y se estima
 * con el reloj contra lo que suele tardar; preparar no admite ni eso, porque depende de la
 * carga de la máquina, así que usa una curva que se frena sola.
 */
function runningFraction(phase: PhaseState, nowMs: number): number {
  if (phase.key === 'write') return Math.min((phase.files ?? 0) / EXPECTED_FILES, ESTIMATE_CAP)
  if (phase.key === 'install') return Math.min((elapsedOf(phase, nowMs) ?? 0) / EXPECTED_INSTALL_MS, ESTIMATE_CAP)
  if (phase.key === 'prepare') return decelerating(Math.max(elapsedOf(phase, nowMs) ?? 0, 0), PREPARE_SCALE_MS)
  // las fases post-install no dan medida intermedia: reloj contra lo que suelen tardar
  if (phase.key === 'fill') return Math.min((elapsedOf(phase, nowMs) ?? 0) / EXPECTED_FILL_MS, ESTIMATE_CAP)
  if (phase.key === 'validate') return Math.min((elapsedOf(phase, nowMs) ?? 0) / EXPECTED_VALIDATE_MS, ESTIMATE_CAP)
  if (phase.key === 'repair') return Math.min((elapsedOf(phase, nowMs) ?? 0) / EXPECTED_REPAIR_MS, ESTIMATE_CAP)
  return 0
}

/**
 * Avance sin duración conocida: rápido al principio y cada vez más lento, sin alcanzar nunca
 * el final de su fase. Preparar no admite estimación —depende de la carga de la máquina, y
 * entre una libre y la del 2026-08-20 hay un factor de diez—, así que una recta con tope daría
 * el escalón de clavarse de golpe; esto se frena solo. A `PREPARE_SCALE_MS` lleva el 63 % de
 * su fase andado, al doble el 86 %, y de ahí en adelante repta.
 */
function decelerating(elapsedMs: number, scaleMs: number): number {
  return ESTIMATE_CAP * (1 - Math.exp(-elapsedMs / scaleMs))
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
