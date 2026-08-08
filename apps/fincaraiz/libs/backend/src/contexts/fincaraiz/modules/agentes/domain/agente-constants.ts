export const AGENTE_CONSTRAINTS = {
  NOMBRE: { MIN: 2, MAX: 200 },
  EMAIL: { MAX: 200 },
  TELEFONO: { MAX: 200 },
  COMISIONPORCENTAJE: { MIN: 0 }
} as const
