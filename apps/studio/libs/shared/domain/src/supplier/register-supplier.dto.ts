export interface RegisterSupplierDto {
  id: string
  name: string
  taxId?: string
  email?: string
  phone?: string
  city?: string
  leadTimeDays: number
}
