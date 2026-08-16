import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { DeleteOperationId } from '../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { ClienteId } from '../../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { ClienteRepository } from '../../domain/cliente-repository'
import { PuntoRepository } from '../../../puntos/domain/punto-repository'
import { MuestraRepository } from '../../../muestras/domain/muestra-repository'
import { RemoveClienteInput } from '../dtos/remove-cliente-input.dto'

@Injectable()
export class RemoveClienteUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly puntoRepository: PuntoRepository,
    private readonly muestraRepository: MuestraRepository,
    private readonly txManager: TransactionManager
  ) {}

  async invoke(input: RemoveClienteInput): Promise<void> {
    const clienteId = ClienteId.create(input.id)
    const cliente = await this.clienteRepository.get(clienteId)

    if (!cliente) {
      throw new EntityNotFoundError('Cliente', input.id)
    }

    // La operación identifica ESTE borrado: restaurar revertirá exactamente lo que arrastre
    const op = DeleteOperationId.random()
    // El árbol entero cae en UNA transacción: o se archiva todo o no se archiva nada.
    // Quién cuelga de quién lo resolvió el generador desde el registro (nunca la base de datos).
    await this.txManager.runInTransaction(async () => {
      await this.clienteRepository.remove(clienteId, op)
      const puntoIds = await this.puntoRepository.removeDraggedByClienteId([clienteId.value], op)
      await this.muestraRepository.removeDraggedByPuntoId(puntoIds, op)
    })
  }
}
