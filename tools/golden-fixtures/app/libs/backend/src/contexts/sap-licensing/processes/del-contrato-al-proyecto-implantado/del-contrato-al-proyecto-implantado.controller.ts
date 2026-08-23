import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { UserRoleEnum } from '@app/shared/domain'
import { Roles } from '../../../shared/infrastructure/auth/roles.decorator'
import { ParseUUIDv7Pipe } from '../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { ContractId } from '../../../shared/domain/value-objects/contracts/contract-id.vo'
import { DelContratoAlProyectoImplantadoProcess } from './del-contrato-al-proyecto-implantado.process'

/**
 * Los pasos convergidos del proceso (spec 44): endpoint SOLO donde hay cuerpo real.
 * La guarda vive en el verbo del agregado — un estado que rechaza responde 409.
 */
@Controller('processes/del-contrato-al-proyecto-implantado')
export class DelContratoAlProyectoImplantadoController {
  constructor(private readonly process: DelContratoAlProyectoImplantadoProcess) {}

  /** Paso 8 — Se termina el contrato · transición «terminate» de contract. */
  @Post('termina/:id')
  @Roles(UserRoleEnum.ADMIN, UserRoleEnum.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  termina(@Param('id', ParseUUIDv7Pipe) id: string): Promise<void> {
    return this.process.termina(ContractId.create(id))
  }
}
