import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../shared/domain/errors'
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
 *    - no → 8
 *    - sí → 4
 * 4. Se abre el proyecto de implantación · entidad: project
 * 5. ¿Hay desvío sobre el alcance?
 *    - sí → 6
 *    - no → 7
 * 6. Se negocia una ampliación de alcance
 *    - → 4
 * 7. (fin) Proyecto implantado
 * 8. Se termina el contrato · entidad: contract
 * 9. (fin) Petición descartada
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
   * Paso 4 — Se abre el proyecto de implantación
   * Viene de: 3. ¿El comité aprueba el alcance? (rama «sí»)
   * Viene de: 6. Se negocia una ampliación de alcance
   * Va a: 5. ¿Hay desvío sobre el alcance?
   */
  async proyecto(id: ProjectId): Promise<void> {
    // @ai:begin flow-proyecto — Se abre el proyecto de implantación
    // @ai:end
  }

  /**
   * Paso 6 — Se negocia una ampliación de alcance
   * Viene de: 5. ¿Hay desvío sobre el alcance? (rama «sí»)
   * Va a: 4. Se abre el proyecto de implantación
   */
  async ampliacion(): Promise<void> {
    // @ai:begin flow-ampliacion — Se negocia una ampliación de alcance
    // @ai:end
  }

  /**
   * Paso 8 — Se termina el contrato
   * Ejecuta la transición «terminate» de contract
   * Viene de: 3. ¿El comité aprueba el alcance? (rama «no»)
   * Va a: 9. Petición descartada
   */
  async termina(id: ContractId): Promise<void> {
    const contract = await this.contractRepository.get(id)
    if (!contract) {
      throw new EntityNotFoundError('Contract', id.value)
    }
    contract.terminate()
    await this.contractRepository.save(contract)
  }
}
