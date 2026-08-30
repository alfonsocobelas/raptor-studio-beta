import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../shared/domain/errors'
import { CustomerId } from '../../../shared/domain/value-objects/customers/customer-id.vo'
import { ContractId } from '../../../shared/domain/value-objects/contracts/contract-id.vo'
import { CustomerRepository } from '../../modules/customers/domain/customer-repository'
import { ContractRepository } from '../../modules/contracts/domain/contract-repository'

/**
 * Del alta del cliente al contrato terminado
 *
 * El recorrido desde que se da de alta el cliente hasta que su contrato se termina.
 *
 * 1. (inicio) Llega un cliente nuevo
 * 2. Se da de alta el cliente con sus contactos · entidad: customer
 * 3. Se firma el contrato con su vigencia · entidad: contract
 * 4. ¿El cliente renueva?
 *    - no → 5
 *    - sí → 7
 * 5. Se termina el contrato · entidad: contract
 * 6. (fin) Contrato terminado
 * 7. (fin) Contrato en vigor
 */
@Injectable()
export class DelAltaDelClienteAlContratoTerminadoProcess {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly contractRepository: ContractRepository
  ) {}

  /**
   * Paso 2 — Se da de alta el cliente con sus contactos
   * Viene de: 1. Llega un cliente nuevo
   * Va a: 3. Se firma el contrato con su vigencia
   */
  async alta(id: CustomerId): Promise<void> {
    // @ai:begin flow-alta — Se da de alta el cliente con sus contactos
    // @ai:end
  }

  /**
   * Paso 3 — Se firma el contrato con su vigencia
   * Viene de: 2. Se da de alta el cliente con sus contactos
   * Va a: 4. ¿El cliente renueva?
   */
  async contrato(id: ContractId): Promise<void> {
    // @ai:begin flow-contrato — Se firma el contrato con su vigencia
    // @ai:end
  }

  /**
   * Paso 5 — Se termina el contrato
   * Ejecuta la transición «terminate» de contract
   * Viene de: 4. ¿El cliente renueva? (rama «no»)
   * Va a: 6. Contrato terminado
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
