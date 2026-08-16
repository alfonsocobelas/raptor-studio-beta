import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { PuntoId } from '../../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { PuntoRepository } from '../../domain/punto-repository'
import { MuestraRepository } from '../../../muestras/domain/muestra-repository'
import { RestorePuntoInput } from '../dtos/restore-punto-input.dto'

@Injectable()
export class RestorePuntoUseCase {
  constructor(
    private readonly puntoRepository: PuntoRepository,
    private readonly muestraRepository: MuestraRepository,
    private readonly txManager: TransactionManager
  ) {}

  async invoke(input: RestorePuntoInput): Promise<void> {
    const puntoId = PuntoId.create(input.id)
    // Se revierte LA OPERACIÓN, no la fila: vuelve exactamente lo que aquel borrado
    // arrastró (decisión 1, spec 38). Lo borrado aparte lleva otra operación y se queda.
    const op = await this.puntoRepository.deletedOpOf(puntoId)

    if (!op) {
      throw new EntityNotFoundError('Punto', input.id)
    }

    await this.txManager.runInTransaction(async () => {
      await this.puntoRepository.restoreByOp(op)
      await this.muestraRepository.restoreByOp(op)
    })
  }
}
