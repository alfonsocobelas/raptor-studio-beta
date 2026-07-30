export interface SyncCustomerIdentity {
  sapId: string
  name: string
  city?: string
  country?: string
  customerType: string
}

export interface SyncCustomersInput {
  customers: SyncCustomerIdentity[]
  /** startedAt del run (ISO): marca de presencia para el lifecycle */
  seenAt: string
}

export interface SyncCustomerFailure {
  sapId: string
  reason: string
}

export interface SyncCustomersOutput {
  records: number
  failures: SyncCustomerFailure[]
}
