import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { ClienteId } from '../../../../../shared/domain/value-objects/clientes/cliente-id.vo'
import { ClienteRepository } from '../../domain/cliente-repository'
import { PuntoRepository } from '../../../puntos/domain/punto-repository'
import { MuestraRepository } from '../../../muestras/domain/muestra-repository'
import { RestoreClienteInput } from '../dtos/restore-cliente-input.dto'

@Injectable()
export class RestoreClienteUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly puntoRepository: PuntoRepository,
    private readonly muestraRepository: MuestraRepository,
    private readonly txManager: TransactionManager
  ) {}

  async invoke(input: RestoreClienteInput): Promise<void> {
    const clienteId = ClienteId.create(input.id)
    // Se revierte LA OPERACIÓN, no la fila: vuelve exactamente lo que aquel borrado
    // arrastró (decisión 1, spec 38). Lo borrado aparte lleva otra operación y se queda.
    const op = await this.clienteRepository.deletedOpOf(clienteId)

    if (!op) {
      throw new EntityNotFoundError('Cliente', input.id)
    }

    await this.txManager.runInTransaction(async () => {
      await this.clienteRepository.restoreByOp(op)
      await this.puntoRepository.restoreByOp(op)
      await this.muestraRepository.restoreByOp(op)
    })
  }
}
