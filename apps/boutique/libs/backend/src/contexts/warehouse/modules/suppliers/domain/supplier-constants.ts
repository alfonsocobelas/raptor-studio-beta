export const SUPPLIER_CONSTRAINTS = {
  NAME: { MIN: 2, MAX: 200 },
  TAX_ID: { MAX: 20 },
  EMAIL: { MAX: 200 },
  PHONE: { MAX: 20 },
  CITY: { MAX: 100 },
  LEAD_TIME: { MIN: 0 }
} as const
