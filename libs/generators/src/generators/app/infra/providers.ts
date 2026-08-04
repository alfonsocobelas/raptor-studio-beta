import { defineInfra, type InfraProvider } from './provider'

/**
 * Sin infraestructura: la app se lleva su config en los JSON por entorno, registra en stdout y
 * guarda ficheros en disco. Es el default a propósito — una app entregada sin elegir nube no
 * debe arrastrar el SDK de ninguna.
 */
export const noneInfra = defineInfra({
  value: 'none',
  label: 'Ninguna (sin adapters de nube ni IaC)'
})

/** Orden del registro = orden en el formulario. */
export const INFRA_PROVIDERS: readonly InfraProvider[] = [noneInfra]
