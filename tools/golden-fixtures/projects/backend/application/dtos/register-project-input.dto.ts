export interface RegisterProjectInput {
  id: string
  customerId: string
  customerName: string
  name: string
  description?: string
  startDate: string
  endDate?: string | null
  status?: string
  implementer?: string
}
