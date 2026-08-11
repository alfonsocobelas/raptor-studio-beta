import { Injectable } from '@nestjs/common'
import { ContractId } from '../../../shared/domain/value-objects/contracts/contract-id.vo'
import { ProjectId } from '../../../shared/domain/value-objects/projects/project-id.vo'
import { ContractRepository } from '../../modules/contracts/domain/contract-repository'
import { ProjectRepository } from '../../modules/projects/domain/project-repository'

/**
 * Del contrato al proyecto implantado
 *
 * El recorrido de una venta desde que se firma el contrato hasta que el proyecto queda implantado.
 *
 * 1. (inicio) El cliente pide una implantación
 * 2. Se firma el contrato con su vigencia · entidad: contract
 * 3. ¿El comité aprueba el alcance?
 *    - no → 4
 *    - sí → 5
 * 4. (fin) Petición descartada
 * 5. Se abre el proyecto de implantación · entidad: project
 * 6. ¿Hay desvío sobre el alcance?
 *    - sí → 7
 *    - no → 8
 * 7. Se negocia una ampliación de alcance
 *    - → 5
 * 8. (fin) Proyecto implantado
 */
@Injectable()
export class DelContratoAlProyectoImplantadoProcess {
  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly projectRepository: ProjectRepository
  ) {}

  /**
   * Paso 2 — Se firma el contrato con su vigencia
   * Viene de: 1. El cliente pide una implantación
   * Va a: 3. ¿El comité aprueba el alcance?
   */
  async contrato(id: ContractId): Promise<void> {
    // @ai:begin flow-contrato — Se firma el contrato con su vigencia
    // @ai:end
  }

  /**
   * Paso 5 — Se abre el proyecto de implantación
   * Viene de: 3. ¿El comité aprueba el alcance? (rama «sí»)
   * Viene de: 7. Se negocia una ampliación de alcance
   * Va a: 6. ¿Hay desvío sobre el alcance?
   */
  async proyecto(id: ProjectId): Promise<void> {
    // @ai:begin flow-proyecto — Se abre el proyecto de implantación
    // @ai:end
  }

  /**
   * Paso 7 — Se negocia una ampliación de alcance
   * Viene de: 6. ¿Hay desvío sobre el alcance? (rama «sí»)
   * Va a: 5. Se abre el proyecto de implantación
   */
  async ampliacion(): Promise<void> {
    // @ai:begin flow-ampliacion — Se negocia una ampliación de alcance
    // @ai:end
  }
}
