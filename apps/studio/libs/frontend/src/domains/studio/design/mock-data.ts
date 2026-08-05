import type { DraftField, DraftResource } from '@app/shared/domain'

/**
 * Datos de muestra CON SENTIDO para el mockup: prioridad a los `samples` que
 * aporta la IA por campo; si faltan, heurísticas por nombre/tipo de campo
 * (emails, teléfonos, ciudades, referencias, precios con céntimos, Sí/No,
 * fechas legibles). Determinista siempre.
 */

const CIUDADES = [
  'Valencia',
  'Murcia',
  'Sevilla',
  'Almería',
  'Huelva',
  'Zaragoza',
  'Bilbao',
  'Madrid',
  'Girona',
  'Lugo'
]
const PERSONAS = [
  'María López',
  'Juan Pérez',
  'Lucía Romero',
  'Carlos Sanz',
  'Ana Ferrer',
  'Pablo Ortega',
  'Elena Navarro',
  'Sergio Gil',
  'Carmen Vidal',
  'Diego Mora'
]
const EMPRESAS = [
  'Agroexport Levante S.L.',
  'Distribuciones Sol S.A.',
  'Mercafruit Ibérica',
  'Campo y Sabor S.L.U.',
  'Hortalia Group',
  'Frescos del Norte',
  'La Huerta Digital',
  'Verde Origen S.L.',
  'Fruvema Export',
  'Naturalia Trade'
]

export function buildSampleRows(
  draft: DraftResource,
  count: number,
  others: DraftResource[] = []
): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) =>
    Object.fromEntries(draft.fields.map(field => [field.name, sampleValue(field, i, draft, others)]))
  )
}

/** Totales de mockup coherentes entre KPI y paginación (deterministas por posición). */
export function mockTotal(index: number): number {
  return [124, 87, 53, 205, 68][index % 5]
}

function sampleValue(field: DraftField, i: number, draft: DraftResource, others: DraftResource[] = []): unknown {
  // Un enum solo puede mostrar valores de SU conjunto: unos samples que se
  // salgan de él pintarían un badge que la app nunca podría pintar.
  if (field.type === 'enum' && field.values?.length) {
    return field.values[i % field.values.length].label
  }
  if (field.samples?.length) return field.samples[i % field.samples.length]

  // Una referencia se ve como el NOMBRE del padre: es lo que mostrará la tabla
  // emitida (el uuid queda oculto en el campo id).
  if (field.type === 'ref') {
    const parent = others.find(o => o.name === field.refTo)
    const names = parent?.fields.find(f => f.type === 'string')?.samples
    if (names?.length) return names[i % names.length]
    return `${field.label} ${i + 1}`
  }

  const key = normalize(`${field.name} ${field.label}`)
  switch (field.type) {
    case 'boolean':
      return i % 3 === 2 ? 'No' : 'Sí'
    case 'date': {
      const day = String(3 + ((i * 5) % 25)).padStart(2, '0')
      const month = String(1 + (i % 12)).padStart(2, '0')
      return `${day}/${month}/2026`
    }
    case 'number': {
      if (/precio|importe|total|coste|tarifa|salario|presupuesto/.test(key)) {
        return [1.95, 2.4, 3.1, 0.99, 2.75, 4.5, 1.2, 5.9, 2.05, 3.65][i % 10]
      }
      return [12.5, 48.9, 7.25, 130.4, 22.0, 64.75, 9.9, 84.3, 15.6, 41.1][i % 10]
    }
    case 'integer': {
      if (/stock|unidades|cantidad|existencias/.test(key)) return [120, 85, 64, 200, 42, 156, 33, 91, 77, 18][i % 10]
      if (/edad|anos/.test(key)) return [34, 28, 45, 52, 39, 61, 26, 48, 33, 57][i % 10]
      return [12, 7, 23, 5, 18, 31, 9, 14, 27, 3][i % 10]
    }
    case 'text':
      return [
        'Entrega preferente por la mañana.',
        'Cliente habitual, aplicar descuento.',
        'Revisar antes de enviar.',
        'Sin observaciones.',
        'Confirmado por teléfono.'
      ][i % 5]
    default:
      return stringSample(key, i, draft)
  }
}

function stringSample(key: string, i: number, draft: DraftResource): string {
  if (/email|correo/.test(key)) {
    return (
      ['a.garcia', 'jlopez', 'm.ruiz', 'csanz', 'e.navarro', 'p.ortega', 'l.romero', 'd.mora', 'c.vidal', 's.gil'][
        i % 10
      ] + '@gmail.com'
    )
  }
  if (/telefono|movil/.test(key)) {
    return `6${String(12 + i)
      .padStart(2, '0')
      .slice(-2)} ${String(345 + i * 11).slice(-3)} ${String(678 + i * 7).slice(-3)}`
  }
  if (/origen|ciudad|localidad|provincia|lugar/.test(key)) return CIUDADES[i % CIUDADES.length]
  if (/pais/.test(key)) return ['España', 'Portugal', 'Francia', 'Italia', 'Marruecos'][i % 5]
  if (/referencia|codigo|numero|expediente/.test(key))
    return `${draft.name.slice(0, 3).toUpperCase()}-${String(1041 + i * 13)}`
  if (/empresa|proveedor|razon/.test(key)) return EMPRESAS[i % EMPRESAS.length]
  if (/nombre|titular|contacto|responsable|cliente|dueno/.test(key)) return PERSONAS[i % PERSONAS.length]
  if (/direccion/.test(key)) return `C/ ${CIUDADES[i % 10]} ${3 + i}, ${1 + (i % 5)}º`
  if (/estado|situacion/.test(key)) return ['Activo', 'Activo', 'Pendiente', 'Activo', 'Archivado'][i % 5]
  return `${capitalize(draft.labelSingular)} ${i + 1}`
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
