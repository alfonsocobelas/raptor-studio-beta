export interface RegisterSaleDto {
  id: string
  reference: string
  saleDate: string
  vehicleLabel: string
  clientLabel: string
  salesperson?: string
  amount: number
  discount?: number
  paymentMethod: string
  status: string
}
