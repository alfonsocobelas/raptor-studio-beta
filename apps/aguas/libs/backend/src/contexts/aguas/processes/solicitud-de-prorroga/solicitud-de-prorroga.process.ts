import { Injectable } from '@nestjs/common'

/**
 * Solicitud de PRÓRROGA
 *
 * La prórroga en sí: plantilla con trazabilidad, tasas si las lleva, presentación al organismo y resolución. Si el organismo deniega, el caso vuelve a la encrucijada de fases.
 *
 * 1. (inicio) Tramitaciones prepara la prórroga
 * 2. Se rellena la plantilla: N_LICENCIA_ORIGINAL, cuándo, qué y por qué
 * 3. ¿Lleva tasas?
 *    - sí → 4
 *    - no → 5
 * 4. Se pagan las tasas de la prórroga (mismas acciones que el pago de tasas ordinario)
 * 5. Se presenta la solicitud al organismo (subestado Presentada)
 * 6. Se registra la comunicación al organismo: quién, cuándo y qué
 * 7. ¿Qué resuelve el organismo? (se registra quién, cuándo y qué)
 *    - aceptada → 8
 *    - denegada → 9
 * 8. (fin) Prórroga aceptada (estado Aceptada)
 * 9. (fin) → Flujo: Responsabilidad Solicitud de PRÓRROGA
 */
@Injectable()
export class SolicitudDePRORROGAProcess {
  constructor() {}

  /**
   * Paso 2 — Se rellena la plantilla: N_LICENCIA_ORIGINAL, cuándo, qué y por qué
   * Viene de: 1. Tramitaciones prepara la prórroga
   * Va a: 3. ¿Lleva tasas?
   */
  async rellenarPlantilla(): Promise<void> {
    // @ai:begin flow-rellenar-plantilla — Se rellena la plantilla: N_LICENCIA_ORIGINAL, cuándo, qué y por qué
    // @ai:end
  }

  /**
   * Paso 4 — Se pagan las tasas de la prórroga (mismas acciones que el pago de tasas ordinario)
   * Viene de: 3. ¿Lleva tasas? (rama «sí»)
   * Va a: 5. Se presenta la solicitud al organismo (subestado Presentada)
   */
  async pagarTasas(): Promise<void> {
    // @ai:begin flow-pagar-tasas — Se pagan las tasas de la prórroga (mismas acciones que el pago de tasas ordinario)
    // @ai:end
  }

  /**
   * Paso 5 — Se presenta la solicitud al organismo (subestado Presentada)
   * Viene de: 3. ¿Lleva tasas? (rama «no»)
   * Viene de: 4. Se pagan las tasas de la prórroga (mismas acciones que el pago de tasas ordinario)
   * Va a: 6. Se registra la comunicación al organismo: quién, cuándo y qué
   */
  async presentarOrganismo(): Promise<void> {
    // @ai:begin flow-presentar-organismo — Se presenta la solicitud al organismo (subestado Presentada)
    // @ai:end
  }

  /**
   * Paso 6 — Se registra la comunicación al organismo: quién, cuándo y qué
   * Viene de: 5. Se presenta la solicitud al organismo (subestado Presentada)
   * Va a: 7. ¿Qué resuelve el organismo? (se registra quién, cuándo y qué)
   */
  async registrarComunicacion(): Promise<void> {
    // @ai:begin flow-registrar-comunicacion — Se registra la comunicación al organismo: quién, cuándo y qué
    // @ai:end
  }
}
