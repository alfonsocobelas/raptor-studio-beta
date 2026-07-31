export const GARMENT_CONSTRAINTS = {
  SKU: { MIN: 4, MAX: 20 },
  NAME: { MIN: 2, MAX: 120 },
  BRAND: { MAX: 60 },
  COLOR: { MAX: 40 },
  PRICE: { MIN: 0 },
  STOCK: { MIN: 0 }
} as const
