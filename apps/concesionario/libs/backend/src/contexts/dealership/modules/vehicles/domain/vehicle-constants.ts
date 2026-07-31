export const VEHICLE_CONSTRAINTS = {
  VIN: { MIN: 11, MAX: 17 },
  BRAND: { MIN: 2, MAX: 60 },
  MODEL: { MIN: 1, MAX: 80 },
  VERSION: { MAX: 120 },
  PLATE: { MAX: 12 },
  COLOR: { MAX: 40 },
  YEAR: { MIN: 1990 },
  MILEAGE: { MIN: 0 },
  PRICE: { MIN: 0 },
  NOTES: { MAX: 1000 }
} as const
