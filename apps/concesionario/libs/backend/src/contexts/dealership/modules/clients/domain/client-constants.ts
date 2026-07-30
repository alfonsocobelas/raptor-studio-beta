export const CLIENT_CONSTRAINTS = {
  NAME: { MIN: 2, MAX: 200 },
  TAX_ID: { MAX: 20 },
  EMAIL: { MAX: 200 },
  PHONE: { MAX: 20 },
  CITY: { MAX: 100 },
  ADDRESS: { MAX: 300 },
  NOTES: { MAX: 1000 }
} as const
