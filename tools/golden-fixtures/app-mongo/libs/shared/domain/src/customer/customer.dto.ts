export type CustomerClassification = 'cloud' | 'onprem' | 'hybrid'

export interface CustomerDto {
  id: string
  sapId: string
  name: string
  taxId: string
  industry: string
  address: string
  phone: string
  notes: string
  city: string
  country: string
  customerType: CustomerClassification
  status: string
  archivedAt: string | null
  lastSeenInSyncAt: string | null
}
