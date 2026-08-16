import { Injectable } from '@nestjs/common'

/**
 * Solicitud de PRÓRROGA · Fase I - Tramitaciones
 *
 * Tramitaciones decide entre prorrogar o pedir licencia nueva. Los cinco impedimentos (no admite prórrogas, supera el máximo, permiso caducado, fuera de plazo, denegado por el organismo) cierran la vía de la prórroga.
 *
 * 1. (inicio) Tramitaciones recibe la solicitud de prórroga
 * 2. ¿Prórroga o licencia nueva?
 *    - prórroga → 7
 *    - licencia nueva → 3
 * 3. ¿Se puede pedir licencia nueva?
 *    - sí → 4
 *    - no → 6
 * 4. Se abre la solicitud de licencia nueva (subestado Pendiente)
 * 5. (fin) → Flujo: Solicitud NUEVA de licencia/permiso
 * 6. (fin) Solicitud cancelada
 * 7. ¿Se puede prorrogar? (admite, máximo, permiso vigente, en plazo, no denegado)
 *    - sí → 8
 *    - no → 10
 * 8. Se abre la solicitud de prórroga (subestado Pendiente)
 * 9. (fin) → Flujo: Solicitud de PRÓRROGA
 * 10. (fin) → Flujo: Responsabilidad Solicitud de PRÓRROGA (subestado Pendiente)
 */
@Injectable()
export class SolicitudDePRORROGAFaseITramitacionesProcess {
  constructor() {}

  /**
   * Paso 4 — Se abre la solicitud de licencia nueva (subestado Pendiente)
   * Viene de: 3. ¿Se puede pedir licencia nueva? (rama «sí»)
   * Va a: 5. → Flujo: Solicitud NUEVA de licencia/permiso
   */
  async abrirNueva(): Promise<void> {
    // @ai:begin flow-abrir-nueva — Se abre la solicitud de licencia nueva (subestado Pendiente)
    // @ai:end
  }

  /**
   * Paso 8 — Se abre la solicitud de prórroga (subestado Pendiente)
   * Viene de: 7. ¿Se puede prorrogar? (admite, máximo, permiso vigente, en plazo, no denegado) (rama «sí»)
   * Va a: 9. → Flujo: Solicitud de PRÓRROGA
   */
  async abrirProrroga(): Promise<void> {
    // @ai:begin flow-abrir-prorroga — Se abre la solicitud de prórroga (subestado Pendiente)
    // @ai:end
  }
}
