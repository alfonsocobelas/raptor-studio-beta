export const SALE_CONSTRAINTS = {
  REFERENCE: { MIN: 3, MAX: 20 },
  VEHICLE_LABEL: { MIN: 2, MAX: 200 },
  CLIENT_LABEL: { MIN: 2, MAX: 200 },
  SALESPERSON: { MAX: 120 },
  AMOUNT: { MIN: 0 },
  DISCOUNT: { MIN: 0 }
} as const
