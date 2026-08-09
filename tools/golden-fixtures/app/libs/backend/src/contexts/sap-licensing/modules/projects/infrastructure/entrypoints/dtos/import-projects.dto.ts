import { IsArray } from 'class-validator'
import { RegisterProjectDto } from './register-project.dto'

/** Las filas llegan ya parseadas del cliente; la validación DE VERDAD la hace el dominio. */
export class ImportProjectsDto {
  @IsArray()
  rows!: RegisterProjectDto[]
}
