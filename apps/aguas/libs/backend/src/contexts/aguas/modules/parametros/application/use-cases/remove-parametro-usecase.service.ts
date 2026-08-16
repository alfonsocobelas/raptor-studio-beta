import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { DeleteOperationId } from '../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { ParametroId } from '../../../../../shared/domain/value-objects/parametros/parametro-id.vo'
import { ParametroRepository } from '../../domain/parametro-repository'
import { RemoveParametroInput } from '../dtos/remove-parametro-input.dto'

@Injectable()
export class RemoveParametroUseCase {
  constructor(private readonly parametroRepository: ParametroRepository) {}

  async invoke(input: RemoveParametroInput): Promise<void> {
    const parametroId = ParametroId.create(input.id)
    const parametro = await this.parametroRepository.get(parametroId)

    if (!parametro) {
      throw new EntityNotFoundError('Parametro', input.id)
    }

    // La operación identifica ESTE borrado: restaurar revertirá exactamente lo que arrastre
    const op = DeleteOperationId.random()
    await this.parametroRepository.remove(parametroId, op)
  }
}
