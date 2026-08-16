import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { DeleteOperationId } from '../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { PuntoId } from '../../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { PuntoRepository } from '../../domain/punto-repository'
import { MuestraRepository } from '../../../muestras/domain/muestra-repository'
import { RemovePuntoInput } from '../dtos/remove-punto-input.dto'

@Injectable()
export class RemovePuntoUseCase {
  constructor(
    private readonly puntoRepository: PuntoRepository,
    private readonly muestraRepository: MuestraRepository,
    private readonly txManager: TransactionManager
  ) {}

  async invoke(input: RemovePuntoInput): Promise<void> {
    const puntoId = PuntoId.create(input.id)
    const punto = await this.puntoRepository.get(puntoId)

    if (!punto) {
      throw new EntityNotFoundError('Punto', input.id)
    }

    // La operación identifica ESTE borrado: restaurar revertirá exactamente lo que arrastre
    const op = DeleteOperationId.random()
    // El árbol entero cae en UNA transacción: o se archiva todo o no se archiva nada.
    // Quién cuelga de quién lo resolvió el generador desde el registro (nunca la base de datos).
    await this.txManager.runInTransaction(async () => {
      await this.puntoRepository.remove(puntoId, op)
      await this.muestraRepository.removeDraggedByPuntoId([puntoId.value], op)
    })
  }
}
