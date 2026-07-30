export type ConsumptionSourceValue = 'MANUAL' | 'ME_SAP' | 'HUBSPOT' | 'POLARIS'

export const ConsumptionSource = {
  VALUES: ['MANUAL', 'ME_SAP', 'HUBSPOT', 'POLARIS'] as const satisfies readonly ConsumptionSourceValue[]
}
