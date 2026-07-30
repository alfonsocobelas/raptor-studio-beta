import { SHARED_CONSTRAINTS } from '../../../shared/domain/constants'

export const CUSTOMER_CONSTRAINTS = {
  SAP_ID: { MIN: 3, MAX: 20 },
  NAME: SHARED_CONSTRAINTS.CUSTOMER_NAME,
  TAX_ID: { MAX: 20 },
  INDUSTRY: { MAX: 100 },
  CITY: { MAX: 100 },
  COUNTRY: { MAX: 100 },
  ADDRESS: { MAX: 500 },
  PHONE: SHARED_CONSTRAINTS.PHONE,
  NOTES: { MAX: 1000 },
  MAX_CONTACTS: 20,
  CONTACT: {
    NAME: { MIN: 2, MAX: 200 },
    ROLE: { MAX: 100 },
    EMAIL: { MAX: 200 }
  }
} as const
