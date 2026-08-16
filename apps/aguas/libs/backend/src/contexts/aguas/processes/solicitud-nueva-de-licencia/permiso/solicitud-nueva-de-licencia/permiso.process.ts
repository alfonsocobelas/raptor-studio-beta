import { Injectable } from '@nestjs/common'

/**
 * Solicitud NUEVA de licencia/permiso
 *
 * Cuando la prórroga no es posible: se pide licencia nueva por email, sede electrónica o presencialmente, y a partir de ahí es la solicitud genérica de licencia/permiso/autorización.
 *
 * 1. (inicio) Hace falta una licencia o permiso nuevo
 * 2. ¿Por qué vía se presenta?
 *    - email → 3
 *    - sede → 5
 *    - presencial → 4
 * 3. Se presenta por email al organismo
 *    - → 6
 * 4. Se presenta presencialmente en el organismo
 *    - → 6
 * 5. Se presenta en la sede electrónica
 * 6. Sigue la solicitud genérica de licencia/permiso/autorización
 * 7. (fin) La licencia nueva se resuelve en el flujo genérico
 */
@Injectable()
export class SolicitudNUEVADeLicenciaPermisoProcess {
  constructor() {}

  /**
   * Paso 3 — Se presenta por email al organismo
   * Viene de: 2. ¿Por qué vía se presenta? (rama «email»)
   * Va a: 6. Sigue la solicitud genérica de licencia/permiso/autorización
   */
  async viaEmail(): Promise<void> {
    // @ai:begin flow-via-email — Se presenta por email al organismo
    // @ai:end
  }

  /**
   * Paso 4 — Se presenta presencialmente en el organismo
   * Viene de: 2. ¿Por qué vía se presenta? (rama «presencial»)
   * Va a: 6. Sigue la solicitud genérica de licencia/permiso/autorización
   */
  async viaPresencial(): Promise<void> {
    // @ai:begin flow-via-presencial — Se presenta presencialmente en el organismo
    // @ai:end
  }

  /**
   * Paso 5 — Se presenta en la sede electrónica
   * Viene de: 2. ¿Por qué vía se presenta? (rama «sede»)
   * Va a: 6. Sigue la solicitud genérica de licencia/permiso/autorización
   */
  async viaSede(): Promise<void> {
    // @ai:begin flow-via-sede — Se presenta en la sede electrónica
    // @ai:end
  }

  /**
   * Paso 6 — Sigue la solicitud genérica de licencia/permiso/autorización
   * Viene de: 3. Se presenta por email al organismo
   * Viene de: 5. Se presenta en la sede electrónica
   * Viene de: 4. Se presenta presencialmente en el organismo
   * Va a: 7. La licencia nueva se resuelve en el flujo genérico
   */
  async tramitarGenerica(): Promise<void> {
    // @ai:begin flow-tramitar-generica — Sigue la solicitud genérica de licencia/permiso/autorización
    // @ai:end
  }
}
