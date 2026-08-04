import { selectProvider } from '../plugins/slots'
import { INFRA_PROVIDERS } from './providers'
import type { InfraProvider } from './provider'

/** Un manifiesto por proveedor. La ranura `infra` de `plugins/slots.ts` los expone al usuario. */
export const INFRA: Record<string, InfraProvider> = Object.fromEntries(
  INFRA_PROVIDERS.map(provider => [provider.value, provider])
)

/**
 * El manifiesto del proveedor pedido. La validación (y el mensaje de error) es la del registro
 * de ranuras: un solo sitio decide qué proveedores existen. Sin valor, el default de la ranura.
 */
export function selectInfra(value: string | undefined): InfraProvider {
  return INFRA[selectProvider('infra', value).value]
}
