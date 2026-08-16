import { Injectable } from '@nestjs/common'

/**
 * JOB · Permisos próximos a caducar
 *
 * El job diario mira qué permisos caducan dentro del PLAZO_AVISO_PRORROGA y arranca la responsabilidad de la prórroga.
 *
 * 1. (inicio) El job diario recorre los permisos vigentes
 * 2. ¿Caduca dentro del PLAZO_AVISO_PRORROGA (30 días)?
 *    - dentro de plazo → 3
 *    - fuera de plazo → 5
 * 3. Se arranca la responsabilidad de solicitud de prórroga
 * 4. (fin) → Flujo: Responsabilidad Solicitud de PRÓRROGA
 * 5. (fin) Nada que avisar: el permiso se revisa en la siguiente pasada
 */
@Injectable()
export class JOBPermisosProximosACaducarProcess {
  constructor() {}

  /**
   * Paso 3 — Se arranca la responsabilidad de solicitud de prórroga
   * Viene de: 2. ¿Caduca dentro del PLAZO_AVISO_PRORROGA (30 días)? (rama «dentro de plazo»)
   * Va a: 4. → Flujo: Responsabilidad Solicitud de PRÓRROGA
   */
  async arrancarResponsabilidad(): Promise<void> {
    // @ai:begin flow-arrancar-responsabilidad — Se arranca la responsabilidad de solicitud de prórroga
    // @ai:end
  }
}
