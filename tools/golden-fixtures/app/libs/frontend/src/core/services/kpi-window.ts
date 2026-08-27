/**
 * Ventanas temporales relativas del panel (spec 70). El rango se calcula EN EL NAVEGADOR: «este
 * mes» depende de cuándo se abre el panel, no de cuándo se generó la app.
 *
 * El día se compone de las partes LOCALES de la fecha: cortar por UTC mete el día 1 de cada mes
 * en el mes anterior en cualquier huso al este de Greenwich.
 */
export type KpiWindowPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'days'

/** Rango semiabierto [start, end) en días 'YYYY-MM-DD'. */
export interface KpiRange {
  start: string
  end: string
}

export function localDay(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** El rango de la ventana que contiene a `now`. */
export function windowRange(preset: KpiWindowPreset, days: number | undefined, now: Date): KpiRange {
  const [start, end] = boundsOf(preset, days, now)
  return { start: localDay(start), end: localDay(end) }
}

/** El rango inmediatamente anterior, de la MISMA longitud. */
export function previousRange(preset: KpiWindowPreset, days: number | undefined, now: Date): KpiRange {
  const [start] = boundsOf(preset, days, now)

  if (preset === 'days') {
    const length = days ?? 1
    const previousStart = addDays(start, -length)
    return { start: localDay(previousStart), end: localDay(start) }
  }
  if (preset === 'today') {
    return { start: localDay(addDays(start, -1)), end: localDay(start) }
  }
  if (preset === 'week') {
    return { start: localDay(addDays(start, -7)), end: localDay(start) }
  }

  const months = preset === 'month' ? 1 : preset === 'quarter' ? 3 : 12
  const previousStart = new Date(start.getFullYear(), start.getMonth() - months, 1)
  return { start: localDay(previousStart), end: localDay(start) }
}

function boundsOf(preset: KpiWindowPreset, days: number | undefined, now: Date): [Date, Date] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (preset === 'today') return [today, addDays(today, 1)]
  if (preset === 'days') return [addDays(today, -((days ?? 1) - 1)), addDays(today, 1)]
  if (preset === 'week') {
    // la semana empieza el LUNES: getDay() devuelve 0 el domingo
    const weekday = (today.getDay() + 6) % 7
    const start = addDays(today, -weekday)
    return [start, addDays(start, 7)]
  }
  if (preset === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return [start, new Date(today.getFullYear(), today.getMonth() + 1, 1)]
  }
  if (preset === 'quarter') {
    const firstMonth = Math.floor(today.getMonth() / 3) * 3
    return [new Date(today.getFullYear(), firstMonth, 1), new Date(today.getFullYear(), firstMonth + 3, 1)]
  }

  return [new Date(today.getFullYear(), 0, 1), new Date(today.getFullYear() + 1, 0, 1)]
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}
