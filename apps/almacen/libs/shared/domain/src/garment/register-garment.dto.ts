export interface RegisterGarmentDto {
  id: string
  sku: string
  name: string
  category: string
  size: string
  brand?: string
  color?: string
  price: number
  stock: number
  status: string
}
