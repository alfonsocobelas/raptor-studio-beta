import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { CLIENTE_CONSTRAINTS as LIMITS } from '../../../domain/cliente-constants'
import { ClienteTipo } from '../../../domain/value-objects/cliente-tipo.vo'

export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.NOMBRE.MIN)
  @MaxLength(LIMITS.NOMBRE.MAX)
  nombre?: string

  @IsOptional()
  @IsIn([...ClienteTipo.VALUES])
  tipo?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.TELEFONO.MAX)
  telefono?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.LOCALIDAD.MAX)
  localidad?: string
}
