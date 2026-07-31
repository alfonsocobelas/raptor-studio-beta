export const PROJECT_CONSTRAINTS = {
  NAME: { MIN: 3, MAX: 200 },
  DESCRIPTION: { MAX: 1000 },
  SAP_PROJECT_ID: { MAX: 30 }
} as const
