/**
 * Aritmética de las tarjetas KPI (spec 70). Vive aparte del componente porque aquí están los
 * casos borde —dividir por cero, saturar la barra— y son justo los que un componente no testea
 * bien.
 */
export interface KpiDelta {
  direction: 'up' | 'down' | 'flat'
  /** Ausente cuando el periodo anterior fue 0: no hay porcentaje que calcular */
  percent?: number
  absolute: number
}

export function deltaOf(value: number, previous: number): KpiDelta {
  const absolute = value - previous
  const direction = absolute > 0 ? 'up' : absolute < 0 ? 'down' : 'flat'

  // +∞% no es una variación: con base 0 solo se puede informar del absoluto
  if (previous === 0) return { direction, absolute }

  return { direction, percent: Math.round((absolute / previous) * 1000) / 10, absolute }
}

export function percentOf(value: number, total: number): number {
  if (total === 0) return 0

  return Math.round((value / total) * 1000) / 10
}

/** Progreso hacia el objetivo, saturado: la barra no se sale aunque el valor lo supere. */
export function progressOf(value: number, target: number): number {
  if (target <= 0) return 0

  return Math.min(100, Math.round((value / target) * 100))
}
