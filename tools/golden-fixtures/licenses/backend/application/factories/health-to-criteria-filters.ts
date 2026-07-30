import { InvalidArgumentError } from '../../../../../shared/domain/errors'
import { OBSERVABILITY_THRESHOLDS } from '../../domain/license-constants'
import { HealthStatus } from '../../domain/license-health'

// Rango de consumptionPct de cada etiqueta, calcado de classifyHealth (los umbrales viven en las
// constantes, nunca persistidos). lower/upper son el filtro de borde correspondiente; null = sin borde.
interface PctRange {
  lower: { operator: 'gte' | 'gt'; value: number } | null
  upper: { operator: 'lte' | 'lt'; value: number } | null
}

const { UNDERUSED_PCT, OVERUSED_PCT, CONTRACTUAL_BREACH_PCT } = OBSERVABILITY_THRESHOLDS

// En orden ascendente de rango: la contigüidad de una selección se comprueba sobre este orden.
const HEALTH_ORDER: HealthStatus[] = ['underused', 'healthy', 'overused', 'contractual_breach']

const RANGES: Record<HealthStatus, PctRange> = {
  underused: { lower: null, upper: { operator: 'lt', value: UNDERUSED_PCT } },
  healthy: {
    lower: { operator: 'gte', value: UNDERUSED_PCT },
    upper: { operator: 'lte', value: OVERUSED_PCT }
  },
  overused: {
    lower: { operator: 'gt', value: OVERUSED_PCT },
    upper: { operator: 'lt', value: CONTRACTUAL_BREACH_PCT }
  },
  contractual_breach: { lower: { operator: 'gte', value: CONTRACTUAL_BREACH_PCT }, upper: null }
}

// Traduce la selección de salud del API a filtros de rango sobre consumptionPct (formato Criteria).
// Solo son expresables valores sueltos y uniones contiguas (las que usa el producto); una unión no
// contigua exigiría OR entre filtros, que Criteria no soporta → 400 explícito.
export function healthToCriteriaFilters(health: string[]): Array<Map<string, string>> {
  if (!health.length) {
    return []
  }

  const selected = HEALTH_ORDER.filter(value => health.includes(value))
  if (selected.length !== new Set(health).size) {
    throw new InvalidArgumentError(`Unknown health value in "${health.join(', ')}"`)
  }

  const first = HEALTH_ORDER.indexOf(selected[0])
  const last = HEALTH_ORDER.indexOf(selected[selected.length - 1])
  if (last - first + 1 !== selected.length) {
    throw new InvalidArgumentError(`Health values "${health.join(', ')}" do not form a contiguous range`)
  }

  const bounds = [RANGES[selected[0]].lower, RANGES[selected[selected.length - 1]].upper]
  return bounds
    .filter((bound): bound is NonNullable<typeof bound> => bound !== null)
    .map(
      bound =>
        new Map([
          ['field', 'consumptionPct'],
          ['operator', bound.operator],
          ['value', String(bound.value)]
        ])
    )
}
