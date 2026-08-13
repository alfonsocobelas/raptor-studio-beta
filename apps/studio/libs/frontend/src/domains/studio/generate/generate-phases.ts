/**
 * Las fases de la generación, tal como las cuenta la pantalla (spec 42). Todo lo que la
 * pantalla sabe se calcula aquí: qué fase va, cuál cerró y cuánto tardó. El componente solo
 * pinta lo que este fichero devuelve.
 *
 * Dos decisiones que gobiernan el resto:
 *
 * - **El orden es el REAL del generador**, no el de la maqueta: escribe, ajusta y por último
 *   instala. La pantalla cuenta lo que pasa, no lo que se dibujó.
 * - **La lista solo avanza.** `CREATE` y `UPDATE` se intercalan en la salida de Nx, así que
 *   una fase anterior que reaparece no vuelve a ponerse en curso —la pantalla parpadearía
 *   entre dos filas toda la generación—, aunque sus contadores sí siguen subiendo.
 */
export type PhaseKey = 'prepare' | 'write' | 'configure' | 'install'
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
  { key: 'configure', label: 'Ajustando la configuración', hint: 'Nx, rutas y arranque' },
  { key: 'install', label: 'Instalando dependencias', hint: 'npm install + los componentes' }
]

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

  const target = phases.findIndex(p => p.key === event.phase)
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
