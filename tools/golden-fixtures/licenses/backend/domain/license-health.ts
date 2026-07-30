import { OBSERVABILITY_THRESHOLDS } from './license-constants'

export type HealthStatus = 'healthy' | 'underused' | 'overused' | 'contractual_breach'

export function classifyHealth(consumptionPct: number): HealthStatus {
  if (consumptionPct >= OBSERVABILITY_THRESHOLDS.CONTRACTUAL_BREACH_PCT) {
    return 'contractual_breach'
  }
  if (consumptionPct > OBSERVABILITY_THRESHOLDS.OVERUSED_PCT) {
    return 'overused'
  }
  if (consumptionPct < OBSERVABILITY_THRESHOLDS.UNDERUSED_PCT) {
    return 'underused'
  }
  return 'healthy'
}
