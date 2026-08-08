/** Cómo se lee un valor en pantalla, venga de la tabla, la ficha o una tarjeta. */
export interface ValueFormat {
  type?: 'date' | 'number' | 'boolean'
  /** Etiquetas de un conjunto cerrado: 'en_curso' se lee «En curso» */
  labels?: Record<string, string>
}

/** Sin separador de miles: agrupar convierte un año (2019) en «2.019». */
const NUMBER_FORMAT = new Intl.NumberFormat('es-ES', { useGrouping: false, maximumFractionDigits: 2 })

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })

/**
 * ÚNICO formateador de la app. Cada pantalla que formateaba por su cuenta acabó
 * contradiciendo a las demás: el listado decía «Sí» y la ficha `true`, la tabla
 * «En curso» y la ficha `en_curso`, y un año salía como «2.019». Un valor
 * guardado se lee igual en todas partes o el usuario deja de creerse la app.
 */
export function formatValue(value: unknown, format: ValueFormat = {}): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  if (format.labels) {
    return format.labels[String(value)] ?? String(value)
  }
  if (typeof value === 'boolean' || format.type === 'boolean') {
    return value ? 'Sí' : 'No'
  }
  if (format.type === 'date') {
    const parsed = new Date(String(value))
    return Number.isNaN(parsed.getTime()) ? String(value) : DATE_FORMAT.format(parsed)
  }
  if (format.type === 'number' || typeof value === 'number') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? String(value) : NUMBER_FORMAT.format(parsed)
  }
  return String(value)
}
