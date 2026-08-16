export const PARAMETRO_CONSTRAINTS = {
  CODIGO: { MIN: 2, MAX: 200 },
  NOMBRE: { MAX: 200 },
  METODO: { MAX: 200 },
  LIMITELEGAL: { MIN: 0 },
  PRECIO: { MIN: 0 }
} as const
