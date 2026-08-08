import {
  BillingFrequencyEnum,
  ContractSourceEnum,
  ContractStatusEnum,
  ContractTypeEnum,
  RenewalTypeEnum
} from '@app/shared/domain'

// Etiquetas de presentación en español; los valores de dominio/API se mantienen en inglés
export const CONTRACT_TYPE_LABELS: Record<ContractTypeEnum, string> = {
  [ContractTypeEnum.CLOUD]: 'Cloud',
  [ContractTypeEnum.ONPREM]: 'On-premise',
  [ContractTypeEnum.MIXED]: 'Mixto',
  [ContractTypeEnum.MAINTENANCE]: 'Mantenimiento'
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatusEnum, string> = {
  [ContractStatusEnum.ACTIVE]: 'Activo',
  [ContractStatusEnum.EXPIRING]: 'Por expirar',
  [ContractStatusEnum.EXPIRED]: 'Expirado',
  [ContractStatusEnum.TERMINATED]: 'Terminado'
}

export const CONTRACT_SOURCE_LABELS: Record<ContractSourceEnum, string> = {
  [ContractSourceEnum.AVVALE_SOLD]: 'Vendido por Avvale',
  [ContractSourceEnum.CUSTOMER_OWNED]: 'Propiedad del cliente'
}

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequencyEnum, string> = {
  [BillingFrequencyEnum.MONTHLY]: 'Mensual',
  [BillingFrequencyEnum.QUARTERLY]: 'Trimestral',
  [BillingFrequencyEnum.SEMIANNUAL]: 'Semestral',
  [BillingFrequencyEnum.YEARLY]: 'Anual'
}

export const RENEWAL_TYPE_LABELS: Record<RenewalTypeEnum, string> = {
  [RenewalTypeEnum.AUTO]: 'Automática',
  [RenewalTypeEnum.MANUAL]: 'Manual',
  [RenewalTypeEnum.NONE]: 'Sin renovación'
}
