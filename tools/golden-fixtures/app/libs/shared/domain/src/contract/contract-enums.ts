export enum ContractTypeEnum {
  CLOUD = 'cloud',
  ONPREM = 'onprem',
  MIXED = 'mixed',
  MAINTENANCE = 'maintenance'
}

export enum ContractStatusEnum {
  ACTIVE = 'active',
  EXPIRING = 'expiring',
  EXPIRED = 'expired',
  TERMINATED = 'terminated'
}

export enum ContractSourceEnum {
  AVVALE_SOLD = 'AVVALE_SOLD',
  CUSTOMER_OWNED = 'CUSTOMER_OWNED'
}

export enum BillingFrequencyEnum {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  YEARLY = 'yearly'
}

export enum RenewalTypeEnum {
  AUTO = 'auto',
  MANUAL = 'manual',
  NONE = 'none'
}
