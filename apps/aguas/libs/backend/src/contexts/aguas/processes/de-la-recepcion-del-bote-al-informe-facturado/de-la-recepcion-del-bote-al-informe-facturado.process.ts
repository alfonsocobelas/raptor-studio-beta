import { Injectable } from '@nestjs/common'
import { MuestraId } from '../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { MuestraRepository } from '../../modules/muestras/domain/muestra-repository'

/**
 * De la recepción del bote al informe facturado
 *
 * El recorrido de una muestra desde que entra el bote en recepción hasta que administración la factura.
 *
 * 1. (inicio) Llega el bote del punto de muestreo
 * 2. Se registra la muestra en recepción · entidad: muestra
 * 3. El técnico analiza la muestra · entidad: muestra
 * 4. ¿Todos los parámetros dentro del límite legal?
 *    - sí → 6
 *    - no → 5
 * 5. Se marca la desviación y se repite el análisis · entidad: muestra
 *    - → 4
 * 6. El responsable valida los resultados · entidad: muestra
 * 7. Se emite el informe al cliente · entidad: muestra
 * 8. Administración factura la muestra · entidad: muestra
 * 9. (fin) Muestra cerrada
 */
@Injectable()
export class DeLaRecepcionDelBoteAlInformeFacturadoProcess {
  constructor(private readonly muestraRepository: MuestraRepository) {}

  /**
   * Paso 2 — Se registra la muestra en recepción
   * Deja muestra en estado: recibida
   * Viene de: 1. Llega el bote del punto de muestreo
   * Va a: 3. El técnico analiza la muestra
   */
  async registrar(id: MuestraId): Promise<void> {
    // @ai:begin flow-registrar — Se registra la muestra en recepción
    // @ai:end
  }

  /**
   * Paso 3 — El técnico analiza la muestra
   * Deja muestra en estado: en_analisis
   * Viene de: 2. Se registra la muestra en recepción
   * Va a: 4. ¿Todos los parámetros dentro del límite legal?
   */
  async analizar(id: MuestraId): Promise<void> {
    // @ai:begin flow-analizar — El técnico analiza la muestra
    // @ai:end
  }

  /**
   * Paso 5 — Se marca la desviación y se repite el análisis
   * Deja muestra en estado: fuera_de_rango
   * Viene de: 4. ¿Todos los parámetros dentro del límite legal? (rama «no»)
   * Va a: 4. ¿Todos los parámetros dentro del límite legal?
   */
  async desviacion(id: MuestraId): Promise<void> {
    // @ai:begin flow-desviacion — Se marca la desviación y se repite el análisis
    // @ai:end
  }

  /**
   * Paso 6 — El responsable valida los resultados
   * Deja muestra en estado: validada
   * Viene de: 4. ¿Todos los parámetros dentro del límite legal? (rama «sí»)
   * Va a: 7. Se emite el informe al cliente
   */
  async validar(id: MuestraId): Promise<void> {
    // @ai:begin flow-validar — El responsable valida los resultados
    // @ai:end
  }

  /**
   * Paso 7 — Se emite el informe al cliente
   * Deja muestra en estado: informada
   * Viene de: 6. El responsable valida los resultados
   * Va a: 8. Administración factura la muestra
   */
  async informar(id: MuestraId): Promise<void> {
    // @ai:begin flow-informar — Se emite el informe al cliente
    // @ai:end
  }

  /**
   * Paso 8 — Administración factura la muestra
   * Deja muestra en estado: facturada
   * Viene de: 7. Se emite el informe al cliente
   * Va a: 9. Muestra cerrada
   */
  async facturar(id: MuestraId): Promise<void> {
    // @ai:begin flow-facturar — Administración factura la muestra
    // @ai:end
  }
}
